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
  // Prefer the session that rendered this admin panel. Another tab or stale
  // storage state must not silently substitute a different signed-in user.
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
      throw new Error(result.error || 'Only the primary administrator can manage administrator access.');
    }
    throw new Error(result.error || 'Could not reach the administrator management service.');
  }
  return result.data;
}

export async function listAdministrators(session) {
  const data = await callAdminManagement('list', {}, session);
  return data.administrators || [];
}

export async function inviteAdministrator({ fullName, email }, session) {
  return callAdminManagement('invite', {
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
  }, session);
}
