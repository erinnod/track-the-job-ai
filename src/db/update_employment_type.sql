-- Run this in the Supabase SQL Editor to add and populate the employment_type field

-- First add the column if it doesn't exist
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS employment_type TEXT CHECK (employment_type IN ('Full-time', 'Part-time'));

-- Update employment_type based on the existing type field
UPDATE public.job_applications
SET employment_type = 'Full-time'
WHERE type ILIKE '%full%time%' OR type ILIKE '%full-time%' AND employment_type IS NULL;

UPDATE public.job_applications
SET employment_type = 'Part-time'
WHERE type ILIKE '%part%time%' OR type ILIKE '%part-time%' AND employment_type IS NULL;

-- Set defaults for remaining jobs
UPDATE public.job_applications
SET employment_type = 'Full-time'
WHERE employment_type IS NULL;

-- Verify the update worked correctly
SELECT id, company, position, type, employment_type 
FROM public.job_applications
ORDER BY created_at DESC
LIMIT 10; 