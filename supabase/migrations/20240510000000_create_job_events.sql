-- Create job_events table for tracking job application events
CREATE TABLE IF NOT EXISTS public.job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own job events (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'job_events' 
    AND policyname = 'Users can view their own job events'
  ) THEN
    CREATE POLICY "Users can view their own job events" 
      ON public.job_events 
      FOR SELECT 
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.job_applications 
          WHERE id = job_application_id
        )
      );
  END IF;
END
$$;

-- Create policy to allow users to update their own job events (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'job_events' 
    AND policyname = 'Users can update their own job events'
  ) THEN
    CREATE POLICY "Users can update their own job events" 
      ON public.job_events 
      FOR UPDATE 
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.job_applications 
          WHERE id = job_application_id
        )
      );
  END IF;
END
$$;

-- Create policy to allow users to insert their own job events (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'job_events' 
    AND policyname = 'Users can insert their own job events'
  ) THEN
    CREATE POLICY "Users can insert their own job events" 
      ON public.job_events 
      FOR INSERT 
      WITH CHECK (
        auth.uid() IN (
          SELECT user_id FROM public.job_applications 
          WHERE id = job_application_id
        )
      );
  END IF;
END
$$;

-- Create policy to allow users to delete their own job events (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'job_events' 
    AND policyname = 'Users can delete their own job events'
  ) THEN
    CREATE POLICY "Users can delete their own job events" 
      ON public.job_events 
      FOR DELETE 
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.job_applications 
          WHERE id = job_application_id
        )
      );
  END IF;
END
$$;

-- Create index on job_application_id for faster lookups (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'job_events' 
    AND indexname = 'idx_job_events_job_application_id'
  ) THEN
    CREATE INDEX idx_job_events_job_application_id ON public.job_events (job_application_id);
  END IF;
END
$$;

-- Add comment
COMMENT ON TABLE public.job_events IS 'Stores events related to job applications'; 