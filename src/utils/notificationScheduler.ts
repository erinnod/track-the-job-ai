import cron from 'node-cron';
import { supabase } from '@/lib/supabase';
import { emailService } from './emailService';
import { logger } from './logger';

interface InterviewEvent {
  id: string;
  job_application_id: string;
  date: string;
  title: string;
  description?: string;
  created_at: string;
}

interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: string;
}

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface NotificationPreference {
  user_id: string;
  email_enabled: boolean;
  interview_reminders: boolean;
}

class NotificationScheduler {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.initializeScheduler();
  }

  /**
   * Initialize the notification scheduler
   */
  private initializeScheduler() {
    // Schedule job to run every hour at minute 0
    // This checks for interviews coming up in the next 3 days
    this.cronJob = cron.schedule('0 * * * *', () => {
      this.checkUpcomingInterviews();
    }, {
      scheduled: false, // Don't start automatically
      timezone: 'UTC'
    });

    logger.info('Notification scheduler initialized');
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.start();
      this.isRunning = true;
      logger.info('Notification scheduler started');
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Notification scheduler is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      logger.info('Notification scheduler stopped');
    }
  }

  /**
   * Check for upcoming interviews and send reminders
   */
  async checkUpcomingInterviews() {
    try {
      logger.info('Checking for upcoming interviews...');

      // Get current date and calculate future dates
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

      // Query for upcoming interview events
      const { data: events, error: eventsError } = await supabase
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
        logger.info('No upcoming interviews found');
        return;
      }

      logger.info(`Found ${events.length} upcoming interview events`);

      // Process each event
      for (const event of events) {
        await this.processInterviewEvent(event);
      }

    } catch (error) {
      logger.error('Error checking upcoming interviews:', error);
    }
  }

  /**
   * Process a single interview event
   */
  private async processInterviewEvent(event: InterviewEvent) {
    try {
      const interviewDate = new Date(event.date);
      const now = new Date();
      const daysUntil = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only send reminders for interviews in the next 3 days
      if (daysUntil < 0 || daysUntil > 3) {
        return;
      }

      // Get job application details
      const { data: jobApp, error: jobError } = await supabase
        .from('job_applications')
        .select('id, user_id, company, position, status')
        .eq('id', event.job_application_id)
        .single();

      if (jobError || !jobApp) {
        logger.error('Error fetching job application:', jobError);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', jobApp.user_id)
        .single();

      if (profileError || !profile) {
        logger.error('Error fetching user profile:', profileError);
        return;
      }

      // Get notification preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id, email_enabled, interview_reminders')
        .eq('user_id', jobApp.user_id)
        .single();

      // Default preferences if not found
      const preferences: NotificationPreference = prefs || {
        user_id: jobApp.user_id,
        email_enabled: false,
        interview_reminders: true,
      };

      // Check if user has email notifications enabled
      if (!preferences.email_enabled || !preferences.interview_reminders) {
        logger.info(`Email notifications disabled for user ${jobApp.user_id}`);
        return;
      }

      // Check if we've already sent a reminder for this event
      const reminderKey = `interview_reminder_${event.id}_${daysUntil}`;
      const { data: existingReminder } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', jobApp.user_id)
        .eq('type', 'interview')
        .ilike('description', `%${event.id}%`)
        .ilike('description', `%${daysUntil} day%`)
        .single();

      if (existingReminder) {
        logger.info(`Reminder already sent for event ${event.id} (${daysUntil} days)`);
        return;
      }

      // Send email reminder
      const userName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email?.split('@')[0] || 'User';

      const emailSent = await emailService.sendInterviewReminder(
        profile.email || '',
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

        logger.info(`Interview reminder sent for ${jobApp.position} at ${jobApp.company} (${daysUntil} days)`);
      } else {
        logger.error(`Failed to send interview reminder for ${jobApp.position} at ${jobApp.company}`);
      }

    } catch (error) {
      logger.error('Error processing interview event:', error);
    }
  }

  /**
   * Create a notification record for the reminder
   */
  private async createReminderNotification(
    userId: string,
    event: InterviewEvent,
    jobApp: JobApplication,
    daysUntil: number
  ) {
    try {
      const { error } = await supabase
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
        logger.error('Error creating reminder notification:', error);
      }
    } catch (error) {
      logger.error('Error creating reminder notification:', error);
    }
  }

  /**
   * Manually trigger interview check (for testing)
   */
  async triggerInterviewCheck() {
    logger.info('Manually triggering interview check...');
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
export const notificationScheduler = new NotificationScheduler();
