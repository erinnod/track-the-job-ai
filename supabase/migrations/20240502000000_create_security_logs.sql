-- Create security_logs table for tracking security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create admin role for security log access
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only allow admins to read security logs
CREATE POLICY "Allow admins to read security logs"
  ON public.security_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Allow anyone to insert security logs (necessary for client-side logging)
CREATE POLICY "Allow inserts from anyone"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index on type and timestamp for faster queries
CREATE INDEX idx_security_logs_type_timestamp ON public.security_logs (type, timestamp);

-- Create index on IP for identifying patterns from specific sources
CREATE INDEX idx_security_logs_ip ON public.security_logs (ip);

-- Add comment
COMMENT ON TABLE public.security_logs IS 'Stores security-related events and potential threats'; 