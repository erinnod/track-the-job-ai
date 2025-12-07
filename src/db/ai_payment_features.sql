-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table for AI-generated content
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('cover_letter', 'resume', 'job_recommendation')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_document_id UUID REFERENCES public.user_documents(id) ON DELETE SET NULL,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on ai_generated_content
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own AI content
CREATE POLICY "Users can view their own AI content" 
  ON public.ai_generated_content
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to update their own AI content
CREATE POLICY "Users can update their own AI content" 
  ON public.ai_generated_content
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own AI content
CREATE POLICY "Users can insert their own AI content" 
  ON public.ai_generated_content
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own AI content
CREATE POLICY "Users can delete their own AI content" 
  ON public.ai_generated_content
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own payment transactions
CREATE POLICY "Users can view their own payment transactions" 
  ON public.payment_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a user credits table to track available credits for pay-per-use
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security on user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own credits
CREATE POLICY "Users can view their own credits" 
  ON public.user_credits
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow system to update user credits
CREATE POLICY "System can update user credits" 
  ON public.user_credits
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a credit transactions table to track credit usage
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage')),
  feature_used TEXT CHECK (feature_used IN ('cover_letter', 'resume', 'job_recommendation', null)),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own credit transactions
CREATE POLICY "Users can view their own credit transactions" 
  ON public.credit_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a table for email parsing data
CREATE TABLE IF NOT EXISTS public.parsed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email_subject TEXT NOT NULL,
  email_sender TEXT NOT NULL,
  email_content TEXT NOT NULL,
  parsed_company TEXT,
  parsed_position TEXT,
  parsed_date TIMESTAMP WITH TIME ZONE,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_status BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security on parsed_emails
ALTER TABLE public.parsed_emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own parsed emails
CREATE POLICY "Users can view their own parsed emails" 
  ON public.parsed_emails
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Function to update timestamp on record change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables that need updated_at column management
CREATE TRIGGER update_ai_content_updated_at
BEFORE UPDATE ON public.ai_generated_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a table for email integration settings
CREATE TABLE IF NOT EXISTS public.email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'other')),
  email_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_time TIMESTAMP WITH TIME ZONE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_address)
);

-- Enable Row Level Security on email_integrations
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own email integrations
CREATE POLICY "Users can view their own email integrations" 
  ON public.email_integrations
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to manage their own email integrations
CREATE POLICY "Users can manage their own email integrations" 
  ON public.email_integrations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create a table for tracked emails (specific job-related emails being monitored)
CREATE TABLE IF NOT EXISTS public.tracked_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES public.email_integrations(id) ON DELETE CASCADE NOT NULL,
  email_id TEXT NOT NULL, -- Provider's unique ID for the email
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  snippet TEXT,
  body_text TEXT,
  job_application_id UUID REFERENCES public.job_applications(id) ON DELETE SET NULL,
  parsed_status TEXT CHECK (parsed_status IN ('applied', 'interview', 'rejected', 'offer', null)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, email_id) 
);

-- Enable Row Level Security on tracked_emails
ALTER TABLE public.tracked_emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own tracked emails
CREATE POLICY "Users can view their own tracked emails" 
  ON public.tracked_emails
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a table for email notification settings
CREATE TABLE IF NOT EXISTS public.email_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  notify_on_new_emails BOOLEAN DEFAULT true,
  notify_on_status_change BOOLEAN DEFAULT true,
  daily_digest BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security on email_notification_settings
ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own notification settings
CREATE POLICY "Users can manage their own email notification settings" 
  ON public.email_notification_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Create triggers for update timestamps
CREATE TRIGGER update_email_integrations_updated_at
BEFORE UPDATE ON public.email_integrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_notification_settings_updated_at
BEFORE UPDATE ON public.email_notification_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 