# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ca69e732-5185-448d-96e8-15a11a4ac980

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ca69e732-5185-448d-96e8-15a11a4ac980) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ca69e732-5185-448d-96e8-15a11a4ac980) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# JobTrakr

JobTrakr is a job application tracking system that helps you organize and manage your job search process. It allows you to store information about job applications, track their status, and manage your professional contacts.

## Setting Up Job Storage in Supabase

To enable persistent job storage in your application, you need to create a `job_applications` table in Supabase. Here's how to set it up:

1. Log into your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL code
4. Run the SQL to create the table and its associated policies

```sql
-- Create the job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL,
  applied_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_website TEXT,
  salary TEXT,
  job_description TEXT,
  notes JSONB,
  contacts JSONB,
  events JSONB,
  type TEXT,
  level TEXT,
  remote BOOLEAN DEFAULT false
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to select only their own job applications
CREATE POLICY "Users can select their own job applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a policy to allow users to insert only their own job applications
CREATE POLICY "Users can insert their own job applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow users to update only their own job applications
CREATE POLICY "Users can update their own job applications"
  ON public.job_applications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a policy to allow users to delete only their own job applications
CREATE POLICY "Users can delete their own job applications"
  ON public.job_applications
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Important Notes About Schema

1. **JSONB Columns**: The `notes`, `contacts`, and `events` columns are JSONB types, which allow you to store complex data structures. These columns store arrays and objects as JSON strings in the database.
2. **Data Mapping**: The application automatically handles converting between JavaScript objects/arrays and JSON strings when communicating with the database.

## Code Quality Guidelines

### Logging Best Practices

This project uses a centralized logging utility located at `src/utils/logger.ts` that should be used instead of direct console.log/error calls. This ensures logs can be easily disabled in production.

Example usage:

```typescript
import { logger } from "@/utils/logger";

// Instead of console.error
logger.error("Error fetching data", error);

// Instead of console.log
logger.info("Data loaded successfully", data);

// Development-only debug messages
logger.debug("Detailed debugging info", debugData);
```

Benefits of using the logger:

1. Consistent formatting and log levels
2. Automatic disabling in production
3. Easy integration with external monitoring services
4. Cleaner code with centralized logging logic

### Utilities and Code Reuse

The project includes several utilities to promote code reuse:

1. **Currency Detection**: Use `getCurrencySymbol` and `getCurrencyIcon` from `src/utils/currencyUtils.ts` to handle currency formatting based on location.

2. **Logging**: Use the logger utility as mentioned above.

3. **UI Components**: Leverage the shadcn-ui components in `src/components/ui` for consistent UI elements.

### Code Cleanup Recommendations

A list of console logs that should be replaced with the logger utility can be found in `console-logs-to-remove.md`. These should be addressed before deployment to production.

## Database Setup

The application uses Supabase as its backend, which provides PostgreSQL database and storage capabilities. The following database tables are used:

- **profiles**: User profile information
- **professional_details**: Professional details for users
- **notification_preferences**: User notification settings
- **job_applications**: Core job application data
- **job_application_notes**: Notes for job applications
- **job_application_contacts**: Contact information for job applications
- **job_application_events**: Events related to job applications (interviews, etc.)
- **user_documents**: Documents uploaded by users (resumes, cover letters, etc.)

### Document Storage

The application supports document uploads for resumes, cover letters, and other job-related documents. These are stored in Supabase Storage buckets and referenced in the database.

To set up document storage, you need to:

1. Create a Supabase storage bucket named "documents"
2. Set appropriate RLS (Row Level Security) policies for the bucket
3. Execute the SQL scripts in `src/db/user_documents_table.sql` to create the necessary database table

Documents are organized by user ID and document type:

- Each user's documents are stored in a folder with their user ID
- Within that folder, documents are organized by type (resume, coverletter, other)
- Filenames include timestamps and random strings to ensure uniqueness
