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