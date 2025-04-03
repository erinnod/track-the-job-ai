#!/usr/bin/env node

/**
 * This script adds a user to the admin_users table
 * Usage: node scripts/make_admin.js user@example.com
 *
 * IMPORTANT: This script requires the .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("Please provide an email address");
  console.error("Usage: node scripts/make_admin.js user@example.com");
  process.exit(1);
}

// Check for environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("ERROR: Missing required environment variables.");
  console.error("Please create a .env file with:");
  console.error("SUPABASE_URL=your-project-url");
  console.error("SUPABASE_SERVICE_KEY=your-service-role-key");
  console.error("");
  console.error(
    "You can get these from Supabase dashboard under Project Settings > API"
  );
  process.exit(1);
}

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  try {
    // 1. Find the user by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Error finding user: ${profileError.message}`);
    }

    if (!profiles) {
      throw new Error(`User with email ${email} not found`);
    }

    const userId = profiles.id;

    // 2. Check if user is already an admin
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminCheckError) {
      throw new Error(
        `Error checking admin status: ${adminCheckError.message}`
      );
    }

    if (existingAdmin) {
      console.log(`User ${email} is already an admin`);
      return;
    }

    // 3. Add the user to admin_users table
    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({ user_id: userId });

    if (insertError) {
      throw new Error(`Error making user admin: ${insertError.message}`);
    }

    console.log(`✅ Successfully made ${email} an admin`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

makeAdmin();
