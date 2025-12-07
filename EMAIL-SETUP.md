# Email Notification Setup Guide

This guide will walk you through the setup process to enable email notifications in the JobTrakr application. The application uses Nodemailer on the server-side to send emails and can be configured to work with Gmail, Outlook, or other SMTP providers.

## Server Configuration

The email sending functionality has been moved to the server-side to prevent browser compatibility issues. Nodemailer is now used exclusively on the Node.js server, and the frontend communicates with it via API endpoints.

## Environment Configuration

Add the following environment variables to your server deployment:

```
# Email service configuration
VITE_EMAIL_HOST=smtp.gmail.com
VITE_EMAIL_PORT=587
VITE_EMAIL_SECURE=false
VITE_EMAIL_USER=your_email@gmail.com
VITE_EMAIL_PASSWORD=your_app_password
```

### Setting up with Gmail

1. Create a Gmail account or use an existing one for your application
2. Enable 2-Step Verification for the account at https://myaccount.google.com/security
3. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app and your device
   - Click "Generate"
   - Use the generated 16-character password as your `VITE_EMAIL_PASSWORD`

### Setting up with Outlook

1. Use your Microsoft account or create a new one
2. Configure the following environment variables:
   ```
   VITE_EMAIL_HOST=smtp.office365.com
   VITE_EMAIL_PORT=587
   VITE_EMAIL_SECURE=false
   VITE_EMAIL_USER=your_outlook_email@outlook.com
   VITE_EMAIL_PASSWORD=your_outlook_password
   ```

### Setting up with a custom SMTP server

1. Configure the following environment variables with your SMTP server details:
   ```
   VITE_EMAIL_HOST=your_smtp_server
   VITE_EMAIL_PORT=your_smtp_port
   VITE_EMAIL_SECURE=true_or_false
   VITE_EMAIL_USER=your_smtp_username
   VITE_EMAIL_PASSWORD=your_smtp_password
   ```

## API Endpoints

The system now uses server API endpoints to handle email sending:

1. `/api/email/send` - General purpose email sending endpoint
2. `/api/email/send-verification` - Specific endpoint for sending verification emails

These are implemented in the Express server (server.cjs).

## Setting up Gmail and Outlook OAuth for Email Integration

To allow users to integrate their Gmail or Outlook accounts for job email tracking and notifications, you need to set up OAuth application registration.

### Gmail OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to APIs & Services > OAuth consent screen
4. Configure the consent screen (External user type is fine for testing)
5. Add scopes: `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/userinfo.email`
6. Add the following authorized redirect URIs:
   - `https://yourdomain.com/auth/gmail/callback`
   - `http://localhost:5173/auth/gmail/callback` (for development)
7. Create OAuth Client ID credentials and get your client ID
8. Add the client ID to your environment:
   ```
   VITE_GMAIL_CLIENT_ID=your_google_client_id
   ```

### Outlook OAuth Setup

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Add the following redirect URIs:
   - `https://yourdomain.com/auth/outlook/callback`
   - `http://localhost:5173/auth/outlook/callback` (for development)
5. Add the following API permissions:
   - Microsoft Graph > Delegated permissions > Mail.Read
   - Microsoft Graph > Delegated permissions > User.Read
6. Get your client ID from the Overview page
7. Add the client ID to your environment:
   ```
   VITE_OUTLOOK_CLIENT_ID=your_outlook_client_id
   ```

## Database Setup

The email notification system requires two tables in your Supabase database:

1. `notification_settings` - Stores user notification preferences
2. `email_verification_tokens` - Stores email verification tokens

These tables should be automatically created when you run the Supabase migrations in the `supabase/migrations` folder.

## Testing Email Functionality

After setting up the environment variables and deploying your application:

1. Register a new user or log in with an existing account
2. Navigate to Settings > Notifications
3. The system will automatically attempt to send a verification email to the account
4. Click the verification link in the email to verify your email address
5. Enable the notification types you want to receive (status changes, upcoming interviews, etc.)

## Troubleshooting

If emails are not being sent:

1. Check the server logs for any SMTP connection errors
2. Verify that your SMTP credentials are correct
3. If using Gmail, ensure that you're using an App Password with 2FA enabled
4. Check if your SMTP server has rate limits or restrictions
5. Ensure your server has properly set environment variables

### Browser-related errors

The system has been redesigned to avoid browser compatibility issues by moving Nodemailer to the server side. If you encounter any issues like `Class extends value undefined is not a constructor or null`, ensure you've updated all files and are using the server API approach rather than trying to use Nodemailer directly in the browser.

For any other issues, check the application logs for detailed error messages.
