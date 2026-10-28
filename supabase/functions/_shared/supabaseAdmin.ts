// ==========================================================================
// CampusNest Edge Functions — Supabase Admin Client
// Initialized strictly with server-side environment secrets (Service Role)
// ==========================================================================

// @ts-ignore Deno ESM URL import
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  // @ts-ignore Deno environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  // @ts-ignore Deno environment variables
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Edge Function Configuration Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from server secrets.'
    );
  }

  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
