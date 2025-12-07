const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const emailService = require('./emailService');

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.supabase = null;
    this.initializeScheduler();
  }

  /**
   * Initialize the notification scheduler
   */
  initializeScheduler() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials missing; notification scheduler disabled');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Schedule job to run every hour at minute 0
    // This checks for interviews coming up in the next 3 days
    this.cronJob = cron.schedule('0 * * * *', () => {
      this.checkUpcomingInterviews();
    }, {
      scheduled: false, // Don't start automatically
      timezone: 'UTC'
    });

    console.info('Notification scheduler initialized');
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('Notification scheduler is already running');
      return;
    }

    if (!this.cronJob || !this.supabase) {
      console.warn('Notification scheduler not configured; cannot start');
      return;
    }

    this.cronJob.start();
    this.isRunning = true;
    console.info('Notification scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.warn('Notification scheduler is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.info('Notification scheduler stopped');
    }
  }

  /**
   * Check for upcoming interviews and send reminders
   */
  async checkUpcomingInterviews() {
    if (!this.supabase) {
      console.warn('Supabase not configured; skipping interview check');
      return;
    }

    try {
      // Get current date and calculate future dates
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      // Query for upcoming interview events
      const { data: events, error: eventsError } = await this.supabase
        .from('job_application_events')
        .select(`
          id,
          job_application_id,
          date,
          title,
          description,
          created_at
        `)
        .gte('date', now.toISOString())
        .lte('date', threeDaysFromNow.toISOString())
        .ilike('title', '%interview%');

      if (eventsError) {
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return;
      }

      // Process each event
      for (const event of events) {
        await this.processInterviewEvent(event);
      }

    } catch (error) {
      console.error('Error checking upcoming interviews:', error);
    }
  }

  /**
   * Process a single interview event
   */
  async processInterviewEvent(event) {
    if (!this.supabase) {
      console.warn('Supabase not configured; skipping interview processing');
      return;
    }

    try {
      const interviewDate = new Date(event.date);
      const now = new Date();
      const daysUntil = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only send reminders for interviews in the next 3 days
      if (daysUntil < 0 || daysUntil > 3) {
        return;
      }

      // Get job application details
      const { data: jobApp, error: jobError } = await this.supabase
        .from('job_applications')
        .select('id, user_id, company, position, status')
        .eq('id', event.job_application_id)
        .single();

      if (jobError || !jobApp) {
        console.error('Error fetching job application:', jobError);
        return;
      }

      // Get user profile and auth user data
      const [profileResult, authResult] = await Promise.all([
        this.supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', jobApp.user_id)
          .single(),
        this.supabase.auth.admin.getUserById(jobApp.user_id)
      ]);

      const profile = profileResult.data;
      const authUser = authResult.data?.user;

      if (!profile && !authUser) {
        console.error('Error fetching user data - no profile or auth user found');
        return;
      }

      // Use email from auth.users (most reliable) or fallback to profiles
      const userEmail = authUser?.email || profile?.email;
      if (!userEmail) {
        console.error('No email found for user', jobApp.user_id);
        return;
      }

      // Get notification preferences
      const { data: prefs, error: prefsError } = await this.supabase
        .from('notification_preferences')
        .select('user_id, email_enabled, interview_reminders')
        .eq('user_id', jobApp.user_id)
        .single();

      // Default preferences if not found
      const preferences = prefs || {
        user_id: jobApp.user_id,
        email_enabled: false,
        interview_reminders: true,
      };

      // Check if user has email notifications enabled
      if (!preferences.email_enabled || !preferences.interview_reminders) {
        return;
      }

      // Check if we've already sent a reminder for this event
      const { data: existingReminder } = await this.supabase
        .from('notifications')
        .select('id')
        .eq('user_id', jobApp.user_id)
        .eq('type', 'interview')
        .ilike('description', `%${event.id}%`)
        .ilike('description', `%${daysUntil} day%`)
        .single();

      if (existingReminder) {
        return;
      }

      // Send email reminder
      const userName = profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : userEmail?.split('@')[0] || 'User';

      const emailSent = await emailService.sendInterviewReminder(
        userEmail,
        userName,
        jobApp.company,
        jobApp.position,
        interviewDate,
        daysUntil
      );

      if (emailSent) {
        // Create notification record
        await this.createReminderNotification(
          jobApp.user_id,
          event,
          jobApp,
          daysUntil
        );
      } else {
        console.error(`Failed to send interview reminder for ${jobApp.position} at ${jobApp.company}`);
      }

    } catch (error) {
      console.error('Error processing interview event:', error);
    }
  }

  /**
   * Create a notification record for the reminder
   */
  async createReminderNotification(userId, event, jobApp, daysUntil) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'interview',
          title: `Interview Reminder: ${jobApp.position} at ${jobApp.company}`,
          description: `Your interview for ${jobApp.position} at ${jobApp.company} is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Event ID: ${event.id}`,
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating reminder notification:', error);
      }
    } catch (error) {
      console.error('Error creating reminder notification:', error);
    }
  }

  /**
   * Manually trigger interview check (for testing)
   */
  async triggerInterviewCheck() {
    if (!this.supabase) {
      console.warn('Supabase not configured; cannot trigger interview check');
      return;
    }
    await this.checkUpcomingInterviews();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isEmailAvailable: emailService.isAvailable(),
    };
  }
}

// Export singleton instance
module.exports = new NotificationScheduler();
