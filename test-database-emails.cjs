#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kffbwemulhhsyaiooabh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseEmailFetching() {
  console.log('🔍 Testing Database Email Fetching\n');

  try {
    // Step 1: Get all job applications with upcoming interviews
    console.log('Step 1: Finding job applications with upcoming interviews...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const { data: events, error: eventsError } = await supabase
      .from('job_application_events')
      .select(`
        id,
        job_application_id,
        date,
        title,
        description
      `)
      .gte('date', now.toISOString())
      .lte('date', threeDaysFromNow.toISOString())
      .ilike('title', '%interview%');

    if (eventsError) {
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('✅ No upcoming interviews found in the database');
      return;
    }

    console.log(`✅ Found ${events.length} upcoming interview events\n`);

    // Step 2: For each event, demonstrate email fetching
    for (const event of events) {
      console.log(`📅 Processing interview: ${event.title}`);
      console.log(`   Date: ${new Date(event.date).toLocaleDateString()}`);
      
      // Get job application details
      const { data: jobApp, error: jobError } = await supabase
        .from('job_applications')
        .select('id, user_id, company, position, status')
        .eq('id', event.job_application_id)
        .single();

      if (jobError || !jobApp) {
        console.log(`   ❌ Error fetching job application: ${jobError?.message}`);
        continue;
      }

      console.log(`   Company: ${jobApp.company}`);
      console.log(`   Position: ${jobApp.position}`);
      console.log(`   User ID: ${jobApp.user_id}`);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', jobApp.user_id)
        .single();

      if (profileError) {
        console.log(`   ⚠️  Profile error: ${profileError.message}`);
      }

      if (profile) {
        console.log(`   👤 User: ${profile.first_name || 'N/A'} ${profile.last_name || 'N/A'}`);
        console.log(`   📧 Email (from profiles): ${profile.email || 'Not set'}`);
      } else {
        console.log(`   👤 User: Not found in profiles table`);
      }

      // Get notification preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id, email_enabled, interview_reminders')
        .eq('user_id', jobApp.user_id)
        .single();

      if (prefsError) {
        console.log(`   ⚠️  Preferences error: ${prefsError.message}`);
      }

      if (prefs) {
        console.log(`   🔔 Email enabled: ${prefs.email_enabled ? 'Yes' : 'No'}`);
        console.log(`   🔔 Interview reminders: ${prefs.interview_reminders ? 'Yes' : 'No'}`);
      } else {
        console.log(`   🔔 Preferences: Using defaults (email: false, reminders: true)`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('📊 Summary:');
    console.log('===========');
    console.log('- The system automatically fetches user emails from the database');
    console.log('- Primary source: auth.users table (most reliable)');
    console.log('- Fallback source: profiles table');
    console.log('- User notification preferences are checked before sending');
    console.log('- No manual email configuration needed for users');

  } catch (error) {
    console.error('❌ Error testing database email fetching:', error);
  }
}

// Run the test
testDatabaseEmailFetching();
