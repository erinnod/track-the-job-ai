# Supabase Database Setup for JobTrakr

This directory contains SQL scripts for setting up the database schema in your Supabase project.

## Tables Overview

The database includes the following tables:

1. **profiles** - User profile information
2. **professional_details** - User's professional information
3. **notification_preferences** - User notification settings
4. **job_applications** - Job applications data
5. **job_application_notes** - Notes related to job applications
6. **job_application_contacts** - Contact persons for job applications
7. **job_application_events** - Important events/dates for job applications

## How to Use These Scripts

### Option 1: Supabase SQL Editor

1. Log in to your Supabase dashboard at [https://app.supabase.io](https://app.supabase.io)
2. Select your project
3. Go to the SQL Editor section
4. Create a new query
5. Copy the contents of `supabase_tables.sql` into the SQL editor
6. Run the query

### Option 2: Supabase CLI (for local development)

If you're using the Supabase CLI for local development:

1. Install Supabase CLI if you haven't already:

   ```
   npm install -g supabase
   ```

2. Start Supabase locally:

   ```
   supabase start
   ```

3. Apply the migrations:

   ```
   supabase db reset
   ```

   Or manually:

   ```
   psql -h localhost -p 5432 -U postgres -d postgres -f ./supabase_tables.sql
   ```

## Schema Design

The schema follows these design principles:

- Uses UUID for primary keys
- Implements Row Level Security (RLS) policies to protect user data
- Establishes proper relations between tables
- Uses foreign key constraints for data integrity
- Timestamps for auditing and tracking changes

## Row Level Security

All tables have Row Level Security enabled, which ensures that users can only access their own data. This is enforced by policies that check the authenticated user ID (auth.uid()) against the user_id in each table.

For related tables (like notes, contacts, and events), the security is enforced by checking that the job application belongs to the authenticated user.

## Customization

You may need to adjust the table structures to fit your specific requirements. Common adjustments include:

- Adding additional fields
- Modifying field types
- Adding indexes for performance optimization
- Adjusting default values

Remember to run your adjustments through the Supabase SQL Editor or CLI.
