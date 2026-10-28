import { supabase } from './supabase.js';

async function callAdminManagement(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke('admin-management', {
    body: { action, ...payload },
  });

  if (error) {
    throw new Error(error.message || 'Could not reach the administrator management service.');
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
