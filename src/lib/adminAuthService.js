// ==========================================================================
// CampusNest Admin Authentication Service
// Secure client-side interaction with Supabase Edge Functions for
// Founder-Controlled Administrator Onboarding & OTP Lifecycle
// ==========================================================================

import { supabaseUrl, supabasePublishableKey } from './supabase';

/**
 * Low-level Edge Function invocation helper.
 * Communicates with backend endpoints over HTTPS using the anon/publishable key.
 * Never exposes service-role keys or server secrets to client code.
 */
async function callAdminEdgeFunction(functionName, payload) {
  const baseUrl = (supabaseUrl || '').replace(/\/$/, '');
  
  if (!baseUrl || !supabasePublishableKey) {
    const error = new Error('Supabase environment configuration missing. Please verify VITE_SUPABASE_URL and publishable key.');
    error.status = 503;
    throw error;
  }

  const endpoint = `${baseUrl}/functions/v1/${functionName}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabasePublishableKey,
        'Authorization': `Bearer ${supabasePublishableKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    const netErr = new Error('Network error: Unable to reach CampusNest authorization gateway. Please verify your connection.');
    netErr.status = 0;
    throw netErr;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Gateway responded with HTTP status ${response.status}.`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    err.remainingAttempts = data?.remaining_attempts;
    err.cooldownRemaining = data?.cooldown_remaining;
    err.smsConfigured = data?.sms_configured;
    throw err;
  }

  return data;
}

/**
 * Phase 1: Submit Administrator Registration Intake.
 * Triggers founder clearance verification and SMS OTP dispatch.
 */
export async function requestAdminRegistration({
  fullName,
  username,
  email,
  phone,
  founderVerificationNumber,
}) {
  const payload = {
    full_name: (fullName || '').trim(),
    username: (username || '').trim().toLowerCase(),
    email: (email || '').trim().toLowerCase(),
    phone: (phone || '').replace(/[\s\-()]/g, ''),
    founder_verification_number: (founderVerificationNumber || '').trim(),
  };

  const data = await callAdminEdgeFunction('admin-register-request', payload);

  return {
    success: true,
    requestId: data.request_id,
    cooldownSeconds: data.cooldown_seconds || 60,
    expiresInSeconds: data.expires_in_seconds || 600,
    smsConfigured: data.sms_configured !== false,
    message: data.message || 'Founder authorization OTP dispatched successfully.',
  };
}

/**
 * Phase 2: Verify Submitted OTP & Complete Admin Account Provisioning.
 * On success, backend provisions auth user and assigns authoritative role = 'admin'.
 */
export async function verifyAdminRegistrationOtp({
  requestId,
  otp,
  password,
}) {
  const payload = {
    request_id: requestId,
    otp: (otp || '').trim(),
    password: password,
  };

  const data = await callAdminEdgeFunction('admin-register-verify', payload);

  return {
    success: true,
    email: data.email,
    message: data.message || 'Administrator account provisioned successfully.',
  };
}

/**
 * Phase 3: Resend Founder OTP.
 * Generates fresh OTP & salt, resets 10-minute TTL, enforces 60s cooldown and 3 max resends.
 */
export async function resendAdminRegistrationOtp({
  requestId,
}) {
  const payload = {
    request_id: requestId,
  };

  const data = await callAdminEdgeFunction('admin-register-resend', payload);

  return {
    success: true,
    cooldownSeconds: data.cooldown_seconds || 60,
    expiresInSeconds: data.expires_in_seconds || 600,
    resendsRemaining: data.resends_remaining ?? 0,
    smsConfigured: data.sms_configured !== false,
    message: data.message || 'New founder authorization OTP dispatched successfully.',
  };
}
