/* global process */
// Script to verify table presence and PostgREST connectivity
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually without extra dependencies
let supabaseUrl = 'https://lclparkysukcnfjqbrzq.supabase.co';
let supabaseKey = 'sb_publishable_BI68G8u_dn9pLM-aV9AVgA_rUIN8ebx';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = line.replace('VITE_SUPABASE_URL=', '').trim();
      }
      if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
        supabaseKey = line.replace('VITE_SUPABASE_PUBLISHABLE_KEY=', '').trim();
      }
    }
  }
} catch {
  // Use fallback
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'profiles',
  'cities',
  'areas',
  'colleges',
  'pg_listings',
  'pg_colleges',
  'rooms',
  'amenities',
  'pg_amenities',
  'pg_photos',
  'enquiries',
  'favourites',
  'reviews',
  'reports',
  'admin_actions'
];

async function verifyTables() {
  console.log('--- Verifying CampusNest Supabase Tables ---');
  let missing = [];
  let available = [];

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST205') {
      missing.push(table);
    } else {
      available.push(table);
    }
  }

  console.log(`Available (${available.length}/${TABLES.length}):`, available.join(', ') || 'None yet');
  if (missing.length > 0) {
    console.log(`Waiting for schema execution in Supabase (${missing.length}/${TABLES.length} tables pending)`);
  } else {
    console.log('ALL 15 TABLES VERIFIED IN SUPABASE!');
  }
}

verifyTables();
