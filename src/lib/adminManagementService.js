import { supabase } from './supabase.js';

async function invokeAdminManagement(action, payload, accessToken) {
  const { data, error } = await supabase.functions.invoke('admin-management', {
    body: { action, ...payload },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!error) {
    if (data?.error) throw new Error(data.error);
    return { data, status: null };
  }

  let responseBody = null;
  if (typeof error.context?.clone === 'function') {
    responseBody = await error.context.clone().json().catch(() => null);
  }
  return { error: responseBody?.error || error.message, status: error.context?.status };
}

async function callAdminManagement(action, payload = {}, session) {
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  // Prefer the session that rendered this admin panel
  const activeSession = session || currentSession;
  let accessToken = activeSession?.access_token;
  if (!accessToken) {
    throw new Error('Your administrator session is missing. Sign in again, then retry.');
  }

  let result = await invokeAdminManagement(action, payload, accessToken);
  if (result.status === 401 && activeSession?.refresh_token) {
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: activeSession.refresh_token,
    });
    if (refreshError || !refreshedSession?.access_token) {
      throw new Error('Your administrator session could not be refreshed. Sign in again, then retry.');
    }

    accessToken = refreshedSession.access_token;
    result = await invokeAdminManagement(action, payload, accessToken);
  }

  if (result.error) {
    if (result.status === 401) {
      throw new Error(result.error || 'Supabase rejected the refreshed session. Check that the site and function use the same project.');
    }
    if (result.status === 403) {
      throw new Error(result.error || 'Only the primary administrator (suyashdhengle540@gmail.com) can manage administrator access.');
    }
    throw new Error(result.error || 'Could not reach the administrator management service.');
  }
  return result.data;
}

export async function listAdministrators(session) {
  // 1. Authoritative direct query from public.profiles:
  // Fast, dependable, zero cold-start delay, and never blocked by gateway errors.
  try {
    const { data: dbAdmins, error: dbError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, can_manage_admins, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (!dbError && dbAdmins && dbAdmins.length > 0) {
      return dbAdmins.map((admin) => {
        const isPrimary = admin.can_manage_admins === true || admin.email?.toLowerCase() === 'suyashdhengle540@gmail.com';
        return {
          ...admin,
          status: isPrimary ? 'Primary Administrator' : 'Active',
          last_sign_in_at: null,
        };
      });
    }
  } catch (err) {
    console.warn('Direct database admin lookup notice:', err);
  }

  // 2. Fallback to Edge Function if database direct query returned empty
  try {
    const data = await callAdminManagement('list', {}, session);
    return data.administrators || [];
  } catch (err) {
    console.warn('Edge function list notice:', err);
    return [];
  }
}

export async function inviteAdministrator({ fullName, email }, session) {
  return callAdminManagement('invite', {
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
  }, session);
}
