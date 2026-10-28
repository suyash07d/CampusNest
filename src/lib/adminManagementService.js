import { supabase } from './supabase.js';

async function callAdminManagement(action, payload = {}) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error('Your administrator session has expired. Sign out and sign back in, then try again.');
  }

  const { data, error } = await supabase.functions.invoke('admin-management', {
    body: { action, ...payload },
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    let responseBody = null;
    if (typeof error.context?.clone === 'function') {
      responseBody = await error.context.clone().json().catch(() => null);
    }

    const status = error.context?.status;
    if (status === 401) {
      throw new Error(responseBody?.error || 'Supabase rejected the session. Sign out and sign back in, then try again.');
    }
    if (status === 403) {
      throw new Error(responseBody?.error || 'Only the primary administrator can manage administrator access.');
    }

    throw new Error(responseBody?.error || error.message || 'Could not reach the administrator management service.');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function listAdministrators() {
  const data = await callAdminManagement('list');
  return data.administrators || [];
}

export async function inviteAdministrator({ fullName, email }) {
  return callAdminManagement('invite', {
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
  });
}
