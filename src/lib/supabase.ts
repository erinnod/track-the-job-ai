import { createClient } from "@supabase/supabase-js";

// Supabase client setup
// Get URL and key from environment variables if available, otherwise fall back to defined values
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kffbwemulhhsyaiooabh.supabase.co";

// Note: This is the public anon key, not a secret
// In production, use environment variables set in your deployment platform (Vercel, Netlify, etc.)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmJ3ZW11bGhoc3lhaW9vYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MDMzNTUsImV4cCI6MjA1OTE3OTM1NX0.CXa9wXaqwD7FVSnfUs120xD3NWg-GsNnBhwfbt4OSNg";

// Create Supabase client with additional configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "jobtrakr-web-app",
    },
  },
});
