-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create professional_details table
CREATE TABLE IF NOT EXISTS public.professional_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT,
  company TEXT,
  industry TEXT,
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security on professional_details
ALTER TABLE public.professional_details ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own professional details
CREATE POLICY "Users can view their own professional details" 
  ON public.professional_details 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own professional details
CREATE POLICY "Users can update their own professional details" 
  ON public.professional_details 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own professional details
CREATE POLICY "Users can insert their own professional details" 
  ON public.professional_details 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  job_matches BOOLEAN DEFAULT TRUE,
  application_status BOOLEAN DEFAULT TRUE,
  interview_reminders BOOLEAN DEFAULT TRUE,
  marketing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own notification preferences
CREATE POLICY "Users can view their own notification preferences" 
  ON public.notification_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own notification preferences
CREATE POLICY "Users can update their own notification preferences" 
  ON public.notification_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences" 
  ON public.notification_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'saved')),
  applied_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logo_url TEXT,
  company_website TEXT,
  salary TEXT,
  job_description TEXT,
  type TEXT, -- Full-time, Part-time, Contract
  remote BOOLEAN DEFAULT FALSE,
  work_type TEXT CHECK (work_type IN ('On-site', 'Remote', 'Hybrid')),
  employment_type TEXT CHECK (employment_type IN ('Full-time', 'Part-time')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own job applications
CREATE POLICY "Users can view their own job applications" 
  ON public.job_applications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own job applications
CREATE POLICY "Users can update their own job applications" 
  ON public.job_applications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own job applications
CREATE POLICY "Users can insert their own job applications" 
  ON public.job_applications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own job applications
CREATE POLICY "Users can delete their own job applications" 
  ON public.job_applications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create job_application_notes table
CREATE TABLE IF NOT EXISTS public.job_application_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_application_id UUID REFERENCES public.job_applications ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on job_application_notes
ALTER TABLE public.job_application_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own job application notes
CREATE POLICY "Users can view their own job application notes" 
  ON public.job_application_notes 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to insert their own job application notes
CREATE POLICY "Users can insert their own job application notes" 
  ON public.job_application_notes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to delete their own job application notes
CREATE POLICY "Users can delete their own job application notes" 
  ON public.job_application_notes 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create job_application_contacts table
CREATE TABLE IF NOT EXISTS public.job_application_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_application_id UUID REFERENCES public.job_applications ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on job_application_contacts
ALTER TABLE public.job_application_contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own job application contacts
CREATE POLICY "Users can view their own job application contacts" 
  ON public.job_application_contacts 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to update their own job application contacts
CREATE POLICY "Users can update their own job application contacts" 
  ON public.job_application_contacts 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to insert their own job application contacts
CREATE POLICY "Users can insert their own job application contacts" 
  ON public.job_application_contacts 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to delete their own job application contacts
CREATE POLICY "Users can delete their own job application contacts" 
  ON public.job_application_contacts 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create job_application_events table
CREATE TABLE IF NOT EXISTS public.job_application_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_application_id UUID REFERENCES public.job_applications ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on job_application_events
ALTER TABLE public.job_application_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own job application events
CREATE POLICY "Users can view their own job application events" 
  ON public.job_application_events 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to update their own job application events
CREATE POLICY "Users can update their own job application events" 
  ON public.job_application_events 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to insert their own job application events
CREATE POLICY "Users can insert their own job application events" 
  ON public.job_application_events 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create policy to allow users to delete their own job application events
CREATE POLICY "Users can delete their own job application events" 
  ON public.job_application_events 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.job_applications 
      WHERE id = job_application_id
    )
  );

-- Create user_documents table
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

-- Enable Row Level Security on user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own documents
CREATE POLICY "Users can view their own documents" 
  ON public.user_documents 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own documents
CREATE POLICY "Users can insert their own documents" 
  ON public.user_documents 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents" 
  ON public.user_documents 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" 
  ON public.user_documents 
  FOR DELETE 
  USING (auth.uid() = user_id);
