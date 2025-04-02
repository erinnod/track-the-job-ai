
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://kffbwemulhhsyaiooabh.supabase.co';
// Note: This is the public anon key, not a secret
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
