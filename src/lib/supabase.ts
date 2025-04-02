
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://kffbwemulhhsyaiooabh.supabase.co';
// Note: This is the public anon key, not a secret
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
