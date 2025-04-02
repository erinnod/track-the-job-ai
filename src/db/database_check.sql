-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('resume', 'coverletter', 'other')),
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on user_documents if not already enabled
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for user_documents if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can view their own documents'
  ) THEN
    CREATE POLICY "Users can view their own documents" 
      ON public.user_documents 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can insert their own documents'
  ) THEN
    CREATE POLICY "Users can insert their own documents" 
      ON public.user_documents 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can update their own documents'
  ) THEN
    CREATE POLICY "Users can update their own documents" 
      ON public.user_documents 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can delete their own documents'
  ) THEN
    CREATE POLICY "Users can delete their own documents" 
      ON public.user_documents 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create Storage bucket for documents if it doesn't exist
-- Note: This requires Supabase admin privileges to run and should be run manually in the Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- Output the schema status
SELECT 
  table_name, 
  EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = table_name
  ) AS exists
FROM (VALUES 
  ('profiles'),
  ('professional_details'), 
  ('notification_preferences'), 
  ('job_applications'), 
  ('job_application_notes'),
  ('job_application_contacts'),
  ('job_application_events'),
  ('user_documents')
) AS t(table_name);

-- Output policy status for user_documents
SELECT 
  policyname, 
  tablename, 
  permissive, 
  cmd 
FROM pg_policies 
WHERE tablename = 'user_documents'; 