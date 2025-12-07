#!/usr/bin/env node

console.log('📧 JobTrakr Email Notification Setup\n');

console.log('This script will help you set up email notifications for interview reminders.\n');

console.log('Step 1: Gmail Setup');
console.log('===================');
console.log('1. Go to your Google Account settings: https://myaccount.google.com/');
console.log('2. Enable 2-Factor Authentication if not already enabled');
console.log('3. Go to Security → 2-Step Verification → App passwords');
console.log('4. Generate a new app password for "Mail"');
console.log('5. Copy the 16-character password\n');

console.log('Step 2: Environment Variables');
console.log('=============================');
console.log('Create a .env file in your project root with the following variables:\n');

const envExample = `# Email Configuration for Interview Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-gmail@gmail.com

# Test email for testing the system (optional)
TEST_EMAIL=test@example.com

# Note: User emails are automatically fetched from the database
# No need to manually configure recipient emails`;

console.log(envExample);

console.log('\nStep 3: How Email Fetching Works');
console.log('================================');
console.log('The system automatically fetches user emails from the database:');
console.log('1. When an interview reminder is due, the system looks up the job application');
console.log('2. Gets the user_id from the job application');
console.log('3. Fetches the user email from auth.users table (primary source)');
console.log('4. Falls back to profiles table if needed');
console.log('5. Checks user notification preferences before sending');
console.log('6. Sends the email to the user\'s email address\n');

console.log('Step 4: Test Configuration');
console.log('==========================');
console.log('After setting up your .env file, run:');
console.log('node test-email.cjs\n');

console.log('Step 5: Test Database Email Fetching');
console.log('====================================');
console.log('To see how the system fetches emails from the database:');
console.log('node test-database-emails.js\n');

console.log('Step 6: Start the Server');
console.log('========================');
console.log('The notification scheduler will start automatically when you run:');
console.log('npm run serve\n');

console.log('Step 7: Add Interview Components');
console.log('================================');
console.log('Add the InterviewEvents component to your job detail pages:\n');

const componentExample = `import InterviewEvents from '@/components/jobs/InterviewEvents';

// In your job detail component
<InterviewEvents 
  jobApplicationId={job.id}
  company={job.company}
  position={job.position}
/>`;

console.log(componentExample);
console.log('\n✅ Setup complete! Your email notification system is ready to use.');
console.log('\n🎯 Key Benefits:');
console.log('- No manual email configuration needed for users');
console.log('- Emails are automatically fetched from the database');
console.log('- User notification preferences are respected');
console.log('- Beautiful, professional email templates');
console.log('- Duplicate prevention and smart scheduling');
