-- Create function for updating the timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create manual_imports table
CREATE TABLE public.manual_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manual_imports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own manual imports" 
  ON public.manual_imports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual imports" 
  ON public.manual_imports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual imports" 
  ON public.manual_imports FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create an index for quick lookups by user_id
CREATE INDEX manual_imports_user_id_idx ON public.manual_imports (user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_manual_imports_updated_at
BEFORE UPDATE ON public.manual_imports
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at(); 