import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || globalThis?.process?.env?.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || globalThis?.process?.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey) {
  if (typeof window !== 'undefined') {
    console.warn(
      'CampusNest: Supabase environment variables missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured in .env.local or your deployment settings.'
    );
  }
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);
