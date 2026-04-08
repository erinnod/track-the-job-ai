// Load environment variables for scheduler
require("dotenv").config();
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
const emailService = require("./emailService");

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
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn(
        "Supabase service role credentials missing; notification scheduler disabled"
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.weeklyJob = null;

    // Schedule hourly interview reminder check
    this.cronJob = cron.schedule(
      "0 * * * *",
      () => {
        this.checkUpcomingInterviews();
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    // Schedule weekly summary email: every Monday at 9:00 AM UTC
    this.weeklyJob = cron.schedule(
      "0 9 * * 1",
      () => {
        this.sendWeeklySummaries();
      },
      {
        scheduled: false,
        timezone: "UTC",
      }
    );

    console.info("Notification scheduler initialized");
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn("Notification scheduler is already running");
      return;
    }

    if (!this.cronJob || !this.supabase) {
      console.warn("Notification scheduler not configured; cannot start");
      return;
    }

    this.cronJob.start();
    if (this.weeklyJob) this.weeklyJob.start();
    this.isRunning = true;
    console.info("Notification scheduler started");
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.warn("Notification scheduler is not running");
      return;
    }

    if (this.cronJob) this.cronJob.stop();
    if (this.weeklyJob) this.weeklyJob.stop();
    this.isRunning = false;
    console.info("Notification scheduler stopped");
  }

  /**
   * Check for upcoming interviews and send reminders
   */
  async checkUpcomingInterviews() {
    if (!this.supabase) {
      console.warn("Supabase not configured; skipping interview check");
      return;
    }

    try {
      // Get current date and calculate future dates
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      // Query for upcoming interview events
      const { data: events, error: eventsError } = await this.supabase
        .from("job_application_events")
        .select(
          `
          id,
          job_application_id,
          date,
          title,
          description,
          created_at
        `
        )
        .gte("date", now.toISOString())
        .lte("date", threeDaysFromNow.toISOString())
        .ilike("title", "%interview%");

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
      console.error("Error checking upcoming interviews:", error);
    }
  }

  /**
   * Process a single interview event
   */
  async processInterviewEvent(event) {
    if (!this.supabase) {
      console.warn("Supabase not configured; skipping interview processing");
      return;
    }

    try {
      const interviewDate = new Date(event.date);
      const now = new Date();
      const daysUntil = Math.ceil(
        (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only send reminders for interviews in the next 3 days
      if (daysUntil < 0 || daysUntil > 3) {
        return;
      }

      // Get job application details
      const { data: jobApp, error: jobError } = await this.supabase
        .from("job_applications")
        .select("id, user_id, company, position, status")
        .eq("id", event.job_application_id)
        .single();

      if (jobError || !jobApp) {
        console.error("Error fetching job application:", jobError);
        return;
      }

      // Get user profile and auth user data
      const [profileResult, authResult] = await Promise.all([
        this.supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", jobApp.user_id)
          .single(),
        this.supabase.auth.admin.getUserById(jobApp.user_id),
      ]);

      const profile = profileResult.data;
      const authUser = authResult.data?.user;

      if (!profile && !authUser) {
        console.error(
          "Error fetching user data - no profile or auth user found"
        );
        return;
      }

      // Use email from auth.users (most reliable) or fallback to profiles
      const userEmail = authUser?.email || profile?.email;
      if (!userEmail) {
        console.error("No email found for user", jobApp.user_id);
        return;
      }

      // Get notification preferences
      const { data: prefs, error: prefsError } = await this.supabase
        .from("notification_preferences")
        .select("user_id, email_enabled, interview_reminders")
        .eq("user_id", jobApp.user_id)
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
        .from("notifications")
        .select("id")
        .eq("user_id", jobApp.user_id)
        .eq("type", "interview")
        .ilike("description", `%${event.id}%`)
        .ilike("description", `%${daysUntil} day%`)
        .single();

      if (existingReminder) {
        return;
      }

      // Send email reminder
      const userName =
        profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : userEmail?.split("@")[0] || "User";

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
        console.error(
          `Failed to send interview reminder for ${jobApp.position} at ${jobApp.company}`
        );
      }
    } catch (error) {
      console.error("Error processing interview event:", error);
    }
  }

  /**
   * Create a notification record for the reminder
   */
  async createReminderNotification(userId, event, jobApp, daysUntil) {
    try {
      const { error } = await this.supabase.from("notifications").insert({
        user_id: userId,
        type: "interview",
        title: `Interview Reminder: ${jobApp.position} at ${jobApp.company}`,
        description: `Your interview for ${jobApp.position} at ${
          jobApp.company
        } is in ${daysUntil} day${daysUntil === 1 ? "" : "s"}. Event ID: ${
          event.id
        }`,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creating reminder notification:", error);
      }
    } catch (error) {
      console.error("Error creating reminder notification:", error);
    }
  }

  /**
   * Manually trigger interview check (for testing)
   */
  async triggerInterviewCheck() {
    if (!this.supabase) {
      console.warn("Supabase not configured; cannot trigger interview check");
      return;
    }
    await this.checkUpcomingInterviews();
  }

  /**
   * Send the weekly job search summary to all opted-in users.
   * Runs every Monday at 9:00 AM UTC.
   */
  async sendWeeklySummaries() {
    if (!this.supabase) {
      console.warn("Supabase not configured; skipping weekly summaries");
      return;
    }

    console.info("[WeeklySummary] Starting weekly summary run");

    try {
      // Find users who have opted in to weekly summaries
      const { data: prefs, error: prefsError } = await this.supabase
        .from("notification_preferences")
        .select("user_id, email_enabled, weekly_summary")
        .eq("email_enabled", true)
        .eq("weekly_summary", true);

      if (prefsError) {
        console.error("[WeeklySummary] Error fetching preferences:", prefsError);
        return;
      }

      if (!prefs || prefs.length === 0) {
        console.info("[WeeklySummary] No users opted in to weekly summaries");
        return;
      }

      for (const pref of prefs) {
        try {
          await this.sendWeeklySummaryForUser(pref.user_id);
        } catch (err) {
          console.error(
            `[WeeklySummary] Error sending summary for user ${pref.user_id}:`,
            err
          );
        }
      }

      console.info(
        `[WeeklySummary] Finished: processed ${prefs.length} user(s)`
      );
    } catch (err) {
      console.error("[WeeklySummary] Unexpected error:", err);
    }
  }

  /**
   * Build and send the weekly summary for a single user.
   */
  async sendWeeklySummaryForUser(userId) {
    // Fetch user details
    const [authResult, profileResult] = await Promise.all([
      this.supabase.auth.admin.getUserById(userId),
      this.supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .single(),
    ]);

    const authUser = authResult.data?.user;
    const profile = profileResult.data;
    const userEmail = authUser?.email || profile?.email;
    const userName =
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : userEmail?.split("@")[0] || "there";

    if (!userEmail) return;

    // Fetch all applications
    const { data: jobs, error: jobsError } = await this.supabase
      .from("job_applications")
      .select("id, company, position, status, applied_date, last_updated")
      .eq("user_id", userId);

    if (jobsError || !jobs) return;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: jobs.length,
      applied: jobs.filter((j) => j.status === "applied").length,
      interview: jobs.filter((j) => j.status === "interview").length,
      offer: jobs.filter((j) => j.status === "offer").length,
      rejected: jobs.filter((j) => j.status === "rejected").length,
      saved: jobs.filter((j) => j.status === "saved").length,
      newThisWeek: jobs.filter(
        (j) => j.applied_date && new Date(j.applied_date) >= oneWeekAgo
      ).length,
    };

    // Fetch upcoming interviews
    const jobIds = jobs.map((j) => j.id);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let upcomingInterviews = [];
    if (jobIds.length > 0) {
      const { data: events } = await this.supabase
        .from("job_events")
        .select("job_application_id, date, title")
        .in("job_application_id", jobIds)
        .gte("date", now.toISOString())
        .lte("date", sevenDaysFromNow.toISOString())
        .ilike("title", "%interview%")
        .order("date", { ascending: true });

      if (events) {
        upcomingInterviews = events.map((e) => {
          const job = jobs.find((j) => j.id === e.job_application_id);
          return {
            company: job?.company || "Unknown",
            position: job?.position || "Unknown",
            date: new Date(e.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
          };
        });
      }
    }

    const html = this.buildWeeklySummaryHtml(
      userName,
      stats,
      upcomingInterviews
    );

    await emailService.sendEmail({
      to: userEmail,
      subject: `Your Weekly Job Search Summary — ${new Date().toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric" }
      )}`,
      html,
    });

    console.info(`[WeeklySummary] Sent summary to ${userEmail}`);
  }

  /**
   * Build the HTML for the weekly summary email.
   */
  buildWeeklySummaryHtml(userName, stats, upcomingInterviews) {
    const statusRows = [
      { label: "Applied", count: stats.applied, color: "#6366f1" },
      { label: "Interviewing", count: stats.interview, color: "#eab308" },
      { label: "Offers", count: stats.offer, color: "#22c55e" },
      { label: "Rejected", count: stats.rejected, color: "#ef4444" },
      { label: "Saved", count: stats.saved, color: "#94a3b8" },
    ]
      .filter((r) => r.count > 0)
      .map(
        (r) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${r.label}</td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
              <span style="background:${r.color}20;color:${r.color};padding:2px 8px;border-radius:9999px;font-weight:600;">${r.count}</span>
            </td>
          </tr>`
      )
      .join("");

    const interviewSection =
      upcomingInterviews.length > 0
        ? `<h3 style="color:#111;margin-bottom:8px;">Upcoming Interviews</h3>
           <ul style="padding-left:18px;margin:0 0 24px;">
             ${upcomingInterviews
               .map(
                 (i) =>
                   `<li style="margin-bottom:6px;"><strong>${i.company}</strong> — ${i.position} <span style="color:#6b7280;">(${i.date})</span></li>`
               )
               .join("")}
           </ul>`
        : "";

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
  <div style="background:#4169E1;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">JobTrakr Weekly Summary</h1>
    <p style="color:#c7d2fe;margin:8px 0 0;">Week ending ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <p>Hi ${userName},</p>
    <p>Here's how your job search is going this week:</p>

    ${
      stats.newThisWeek > 0
        ? `<p style="background:#dbeafe;border-left:4px solid #6366f1;padding:10px 14px;border-radius:4px;margin-bottom:20px;">
        🎉 <strong>${stats.newThisWeek} new application${stats.newThisWeek !== 1 ? "s" : ""}</strong> submitted this week!
      </p>`
        : ""
    }

    <h3 style="color:#111;margin-bottom:8px;">Applications by Status</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Status</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Count</th>
        </tr>
      </thead>
      <tbody>${statusRows}</tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td style="padding:8px 12px;font-weight:600;">Total</td>
          <td style="padding:8px 12px;text-align:center;font-weight:600;">${stats.total}</td>
        </tr>
      </tfoot>
    </table>

    ${interviewSection}

    <p style="color:#6b7280;font-size:14px;">Keep up the great work! Consistency is key. 💪</p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">
      You're receiving this because you enabled weekly summaries in JobTrakr.<br>
      <a href="${process.env.APP_URL || "https://jobtrakr.app"}/settings/notifications" style="color:#6366f1;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
  }

  /**
   * Manually trigger weekly summary (for testing)
   */
  async triggerWeeklySummary() {
    await this.sendWeeklySummaries();
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
