-- Email integrations + tracked emails tables used by src/services/emailService.ts

CREATE TABLE IF NOT EXISTS public.email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email integrations"
  ON public.email_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email integrations"
  ON public.email_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email integrations"
  ON public.email_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email integrations"
  ON public.email_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS email_integrations_user_id_idx
  ON public.email_integrations(user_id);

CREATE TABLE IF NOT EXISTS public.tracked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.email_integrations(id) ON DELETE SET NULL,
  email_id TEXT NOT NULL,
  subject TEXT,
  sender TEXT,
  received_at TIMESTAMPTZ,
  snippet TEXT,
  body_text TEXT,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  parsed_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracked_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracked emails"
  ON public.tracked_emails
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked emails"
  ON public.tracked_emails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked emails"
  ON public.tracked_emails
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked emails"
  ON public.tracked_emails
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS tracked_emails_user_id_idx
  ON public.tracked_emails(user_id);

CREATE INDEX IF NOT EXISTS tracked_emails_integration_id_idx
  ON public.tracked_emails(integration_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_email_integrations_updated_at'
  ) THEN
    CREATE TRIGGER set_email_integrations_updated_at
    BEFORE UPDATE ON public.email_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();
  END IF;
END
$$;

