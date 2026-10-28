// ==========================================================================
// AplaStay — Student Dashboard Service
// Supabase Data Access for Saved PGs, Enquiries, and Profile Preferences
// ==========================================================================

import { supabase } from './supabase';
import { logActivity } from './activityService';

/**
 * Fetch student saved / favorited PGs from public.favourites
 * @param {string} studentId - Authenticated student UUID
 */
export async function getStudentSavedPGs(studentId) {
  if (!studentId) return { favourites: [], count: 0, error: null };

  try {
    const { data, error, count } = await supabase
      .from('favourites')
      .select(`
        id,
        student_id,
        pg_id,
        created_at,
        pg:pg_id (
          id,
          name,
          slug,
          address,
          gender_type,
          starting_monthly_rent,
          food_available,
          food_type,
          notice_period_days,
          areas:area_id (id, name, slug)
        )
      `, { count: 'exact' })
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice querying student favourites:', error.message);
      return { favourites: [], count: 0, error: error.message };
    }

    return { 
      favourites: data || [], 
      count: count || (data?.length || 0), 
      error: null 
    };
  } catch (err) {
    console.warn('getStudentSavedPGs exception:', err);
    return { favourites: [], count: 0, error: err.message };
  }
}

/**
 * Fetch student's submitted enquiries from public.enquiries
 * @param {string} studentId - Authenticated student UUID
 */
export async function getStudentEnquiries(studentId) {
  if (!studentId) return { enquiries: [], count: 0, error: null };

  try {
    const { data, error, count } = await supabase
      .from('enquiries')
      .select(`
        id,
        student_id,
        pg_id,
        room_type_preference,
        visit_date,
        message,
        status,
        created_at,
        updated_at,
        pg:pg_id (
          id,
          name,
          slug,
          address,
          starting_monthly_rent,
          gender_type,
          areas:area_id (id, name, slug)
        )
      `, { count: 'exact' })
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice querying student enquiries:', error.message);
      return { enquiries: [], count: 0, error: error.message };
    }

    return { 
      enquiries: data || [], 
      count: count || (data?.length || 0), 
      error: null 
    };
  } catch (err) {
    console.warn('getStudentEnquiries exception:', err);
    return { enquiries: [], count: 0, error: err.message };
  }
}

/**
 * Remove a PG from student's saved wishlist
 * @param {string} studentId 
 * @param {string} favouriteId 
 */
export async function removeStudentSavedPG(studentId, favouriteId) {
  if (!studentId || !favouriteId) return { success: false };

  try {
    const { error } = await supabase
      .from('favourites')
      .delete()
      .eq('id', favouriteId)
      .eq('student_id', studentId);

    if (error) throw error;

    await logActivity({
      actorId: studentId,
      actorRole: 'student',
      action: 'pg_unfavourited',
      targetType: 'favourite',
      targetId: favouriteId,
    });

    return { success: true };
  } catch (err) {
    console.error('removeStudentSavedPG error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update student profile info (full_name, phone, college_id) in public.profiles
 * @param {string} studentId - Authenticated student UUID
 * @param {Object} updates
 */
export async function updateStudentProfile(studentId, updates) {
  if (!studentId) throw new Error('Student ID is required');

  try {
    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) {
      payload.full_name = updates.full_name.trim();
    }
    if (updates.phone !== undefined) {
      payload.phone = updates.phone ? updates.phone.trim() : null;
    }
    if (updates.college_id !== undefined) {
      payload.college_id = updates.college_id || null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', studentId)
      .select()
      .maybeSingle();

    if (error) throw error;

    await logActivity({
      actorId: studentId,
      actorRole: 'student',
      action: 'profile_updated',
      targetType: 'profile',
      targetId: studentId,
      metadata: {
        college_id: payload.college_id,
        has_phone: !!payload.phone,
      },
    });

    return { profile: data, error: null };
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    return { profile: null, error: err.message };
  }
}

/**
 * Fetch recent activity audit log trail for student
 * @param {string} studentId 
 * @param {number} limit 
 */
export async function getStudentRecentActivity(studentId, limit = 5) {
  if (!studentId) return [];

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('actor_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
