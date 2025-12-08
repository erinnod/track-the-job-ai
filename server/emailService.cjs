// Load environment variables for server-side email service
require("dotenv").config();
const nodemailer = require("nodemailer");

// Email service class
class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Get email configuration from environment variables
      const emailConfig = {
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER || "",
          pass: process.env.EMAIL_PASS || "",
        },
      };

      // Only create transporter if we have valid credentials
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isInitialized = true;
        console.info("Email service initialized successfully");
      } else {
        console.warn(
          "Email credentials not configured. Email notifications will be disabled."
        );
        this.isInitialized = false;
      }
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(content) {
    if (!this.isInitialized || !this.transporter) {
      console.warn("Email service not initialized. Skipping email send.");
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: content.to,
        subject: content.subject,
        html: content.html,
        text: content.text || this.htmlToText(content.html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Convert HTML to plain text for fallback
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .trim();
  }

  /**
   * Send interview reminder email
   */
  async sendInterviewReminder(
    userEmail,
    userName,
    company,
    position,
    interviewDate,
    daysUntil
  ) {
    const dateString = interviewDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timeString = interviewDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const subject = `Interview Reminder: ${position} at ${company}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Reminder</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .interview-details {
              background: white;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .cta-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📅 Interview Reminder</h1>
            <p>Your interview is coming up in ${daysUntil} day${
      daysUntil === 1 ? "" : "s"
    }!</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>This is a friendly reminder about your upcoming interview:</p>
            
            <div class="interview-details">
              <h3>${position}</h3>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Date:</strong> ${dateString}</p>
              <p><strong>Time:</strong> ${timeString}</p>
            </div>
            
            <p>Make sure to:</p>
            <ul>
              <li>Review the job description and your application</li>
              <li>Prepare questions to ask the interviewer</li>
              <li>Plan your route and arrive early</li>
              <li>Dress appropriately for the company culture</li>
            </ul>
            
            <a href="https://jobtrakr.co.uk/applications" class="cta-button">
              View Application Details
            </a>
            
            <p>Good luck with your interview!</p>
            
            <p>Best regards,<br>The JobTrakr Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from JobTrakr. You can manage your notification preferences in your account settings.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  /**
   * Send application status update email
   */
  async sendStatusUpdateEmail(userEmail, userName, company, position, status) {
    const statusMessages = {
      interview: {
        subject: `Interview Scheduled: ${position} at ${company}`,
        message: `Great news! Your application for ${position} at ${company} has moved to the interview stage.`,
      },
      offer: {
        subject: `Job Offer Received: ${position} at ${company}`,
        message: `Congratulations! You've received a job offer for ${position} at ${company}.`,
      },
      rejected: {
        subject: `Application Update: ${position} at ${company}`,
        message: `Your application for ${position} at ${company} was not selected at this time.`,
      },
    };

    const statusInfo = statusMessages[status] || {
      subject: `Application Update: ${position} at ${company}`,
      message: `Your application for ${position} at ${company} has been updated to ${status}.`,
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📬 Application Update</h1>
            <p>Your job application status has changed</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>${statusInfo.message}</p>
            
            <a href="https://jobtrakr.co.uk/applications" class="cta-button">
              View Application Details
            </a>
            
            <p>Best regards,<br>The JobTrakr Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from JobTrakr. You can manage your notification preferences in your account settings.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: statusInfo.subject,
      html,
    });
  }

  /**
   * Check if email service is available
   */
  isAvailable() {
    return this.isInitialized;
  }
}

// Export singleton instance
module.exports = new EmailService();
