
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://kffbwemulhhsyaiooabh.supabase.co';
// Note: This is the public anon key, not a secret
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxNDIwNzMsImV4cCI6MjAyNDcxODA3M30.FrDP6L25U0t_qbOIjxL_BEB3_iXvzWWFR3qD4mueOYw';

// Create Supabase client with explicit type checking to ensure key is valid
if (!supabaseAnonKey) {
  throw new Error('Supabase anonymous key is required');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
