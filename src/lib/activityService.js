// ==========================================================================
// CampusNest — Student Activity Logger Service
// ==========================================================================
// Privacy & Security Rules:
// 1. Strictly append-only.
// 2. Never records passwords, auth tokens, session secrets, or private form contents.
// 3. Failures in activity logging NEVER block or break the user experience.
// ==========================================================================

import { supabase } from './supabase.js';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'hash',
  'cookie',
  'bearer',
];

/**
 * Deeply sanitize metadata to strip any sensitive attributes.
 * @param {Object} data 
 * @returns {Object} Clean, safe JSON object
 */
export function sanitizeMetadata(data) {
  if (!data || typeof data !== 'object') return {};

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some(pat => 
      key.toLowerCase().includes(pat)
    );
    if (isSensitive) continue;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map(item => 
        (typeof item === 'object' && item !== null) ? sanitizeMetadata(item) : item
      );
    } else if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Log a meaningful user activity record to public.activity_logs
 * @param {Object} params
 * @param {string} params.actorId - UUID of the actor (auth.users.id)
 * @param {'student'|'owner'|'admin'} params.actorRole - Role of the actor
 * @param {string} params.action - Meaningful action name (e.g. 'pg_search', 'area_selected')
 * @param {string} [params.targetType] - Entity type (e.g. 'pg_listing', 'college', 'area')
 * @param {string} [params.targetId] - UUID of the target entity if available
 * @param {Object} [params.metadata] - Sanitized contextual details
 */
export async function logActivity({
  actorId,
  actorRole = 'student',
  action,
  targetType = null,
  targetId = null,
  metadata = {},
}) {
  if (!actorId || !action) {
    // Cannot log unauthenticated or nameless events under existing RLS
    return null;
  }

  try {
    const cleanMeta = sanitizeMetadata(metadata);

    const record = {
      actor_id: actorId,
      actor_role: actorRole,
      action: action.trim(),
      target_type: targetType ? targetType.trim() : null,
      target_id: targetId || null,
      metadata: cleanMeta,
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(record)
      .select()
      .maybeSingle();

    if (error) {
      // Gracefully log warning without interrupting user actions
      console.warn('Notice: activity log skipped:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Activity logging caught error:', err);
    return null;
  }
}

/**
 * Convenience helper to log discovery / PG searches
 */
export async function trackSearch({ actorId, actorRole = 'student', query = '', areaSlug = '', collegeSlug = '', filters = {} }) {
  if (!actorId) return null;

  return logActivity({
    actorId,
    actorRole,
    action: 'pg_search',
    target_type: 'college',
    metadata: {
      query: (query || '').trim(),
      area_slug: areaSlug || null,
      college_slug: collegeSlug || null,
      filters: {
        girlsOnly: !!filters.girlsOnly,
        boysOnly: !!filters.boysOnly,
        coed: !!filters.coed,
        mealsIncluded: !!filters.mealsIncluded,
        walkingDistance: !!filters.walkingDistance,
      },
    },
  });
}

/**
 * Convenience helper to track locality / area selection
 */
export async function trackAreaSelect({ actorId, actorRole = 'student', areaSlug, areaName }) {
  if (!actorId) return null;

  return logActivity({
    actorId,
    actorRole,
    action: 'area_selected',
    target_type: 'area',
    metadata: {
      area_slug: areaSlug,
      area_name: areaName,
    },
  });
}

/**
 * Convenience helper to track college / campus anchor selection
 */
export async function trackCollegeSelect({ actorId, actorRole = 'student', collegeSlug, collegeName, areaSlug }) {
  if (!actorId) return null;

  return logActivity({
    actorId,
    actorRole,
    action: 'college_selected',
    target_type: 'college',
    metadata: {
      college_slug: collegeSlug,
      college_name: collegeName,
      area_slug: areaSlug,
    },
  });
}

/**
 * Convenience helper to track PG listing viewing
 */
export async function trackPGView({ actorId, actorRole = 'student', pgId, pgName, collegeName }) {
  if (!actorId) return null;

  return logActivity({
    actorId,
    actorRole,
    action: 'pg_viewed',
    target_type: 'pg_listing',
    targetId: pgId,
    metadata: {
      pg_name: pgName,
      college_name: collegeName,
    },
  });
}

/**
 * Convenience helper to track PG favourite toggle
 */
export async function trackPGFavourite({ actorId, actorRole = 'student', pgId, pgName, isFavourited }) {
  if (!actorId) return null;

  return logActivity({
    actorId,
    actorRole,
    action: isFavourited ? 'pg_favourited' : 'pg_unfavourited',
    target_type: 'pg_listing',
    targetId: pgId,
    metadata: {
      pg_name: pgName,
    },
  });
}
