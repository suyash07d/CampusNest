import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://lclparkysukcnfjqbrzq.supabase.co';
const supabasePublishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_BI68G8u_dn9pLM-aV9AVgA_rUIN8ebx';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)

