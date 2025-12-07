# Email Notification Setup Guide

This guide will help you set up email notifications for interview reminders in JobTrakr.

## Overview

The email notification system sends reminders to users when they have interviews coming up in the next 3 days. Users can control their notification preferences in their account settings.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Email Provider Setup

### Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `EMAIL_PASS`

3. **Configure environment variables**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=your-gmail@gmail.com
   ```

### Other SMTP Providers

You can use any SMTP provider. Here are common configurations:

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Testing Email Configuration

1. **Start the server** with email configuration
2. **Use the test endpoint** to verify email sending:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test \
     -H "Content-Type: application/json" \
     -d '{"userId": "test-user-id", "email": "test@example.com"}'
   ```

3. **Check server logs** for email service status

## User Notification Preferences

Users can control their email notifications through:

1. **Account Settings** → **Notifications**
2. **Email Notifications** toggle
3. **Interview Reminders** toggle

## How It Works

1. **Scheduled Job**: Runs every hour to check for upcoming interviews
2. **Interview Detection**: Looks for events in `job_application_events` table with "interview" in the title
3. **Reminder Timing**: Sends reminders for interviews in the next 3 days
4. **Duplicate Prevention**: Prevents sending multiple reminders for the same event
5. **User Preferences**: Respects user's email notification settings

## Database Tables

The system uses these tables:

- `job_application_events`: Stores interview events
- `notification_preferences`: User notification settings
- `notifications`: In-app notification records
- `profiles`: User profile information

## Troubleshooting

### Email Not Sending

1. **Check environment variables** are set correctly
2. **Verify SMTP credentials** are valid
3. **Check server logs** for error messages
4. **Test with a simple email** first

### Common Issues

- **Gmail App Password**: Make sure you're using an app password, not your regular password
- **Port 587**: Most providers use port 587 for TLS
- **Firewall**: Ensure your server can connect to SMTP servers
- **Rate Limits**: Some providers have sending limits

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_EMAIL=true
```

## Security Considerations

1. **App Passwords**: Use app passwords instead of regular passwords
2. **Environment Variables**: Never commit email credentials to version control
3. **Rate Limiting**: Respect email provider rate limits
4. **User Consent**: Only send emails to users who have opted in

## Monitoring

Monitor the notification system through:

1. **Server logs** for email sending status
2. **Database queries** to check notification records
3. **User feedback** on email delivery
4. **Email provider analytics** for delivery rates
