// ==========================================================================
// CampusNest Edge Functions — Strict Production CORS Policy
// Restricts privileged administrator onboarding endpoints to verified CampusNest origins
// ==========================================================================

const ALLOWED_ORIGINS = [
  'https://campus-nest-plum.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Returns dynamic CORS headers matching allowed origins.
 * Production defaults strictly to https://campus-nest-plum.vercel.app
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req ? req.headers.get('origin') : null;
  const isAllowed = origin 
    ? (ALLOWED_ORIGINS.includes(origin) || (origin.endsWith('.vercel.app') && origin.includes('campus-nest')))
    : false;

  const allowedOrigin = isAllowed && origin ? origin : 'https://campus-nest-plum.vercel.app';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export const corsHeaders = getCorsHeaders();

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
