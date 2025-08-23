// Test script for email notifications
const emailService = require('./server/emailService.cjs');

async function testEmailService() {
  console.log('Testing email service...');
  
  // Check if email service is available
  const isAvailable = emailService.isAvailable();
  console.log('Email service available:', isAvailable);
  
  if (!isAvailable) {
    console.log('Email service not configured. Please set up environment variables:');
    console.log('EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM');
    console.log('\nNote: In production, user emails are automatically fetched from the database.');
    return;
  }
  
  // Test sending an interview reminder
  try {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const result = await emailService.sendInterviewReminder(
      testEmail,
      'Test User',
      'Test Company',
      'Software Engineer',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      1
    );
    
    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log('\n📧 Email System Information:');
      console.log('- User emails are automatically fetched from the database');
      console.log('- Emails come from auth.users table (primary) or profiles table (fallback)');
      console.log('- Notification preferences are checked before sending');
      console.log('- Duplicate reminders are prevented');
    } else {
      console.log('❌ Failed to send test email');
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

// Run the test
testEmailService();
