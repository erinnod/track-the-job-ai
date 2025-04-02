-- Run this in the Supabase SQL Editor to update existing job records
-- This will set the work_type field based on the existing remote boolean field

-- Update remote jobs to have work_type = 'Remote'
UPDATE public.job_applications
SET work_type = 'Remote'
WHERE remote = true AND work_type IS NULL;

-- Update on-site jobs to have work_type = 'On-site'
UPDATE public.job_applications
SET work_type = 'On-site'
WHERE remote = false AND work_type IS NULL;

-- Handle any remaining NULL work_type values
UPDATE public.job_applications
SET work_type = 'On-site'
WHERE work_type IS NULL;

-- Verify the update worked correctly
SELECT id, company, position, remote, work_type 
FROM public.job_applications
ORDER BY created_at DESC
LIMIT 10; 