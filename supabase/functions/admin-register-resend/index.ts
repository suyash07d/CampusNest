// ==========================================================================
// CampusNest Edge Function: admin-register-resend
// Phase 3 of Founder OTP Administrator Onboarding
// Enforces 60s cooldown, max 3 resends, regenerates salted OTP hash, invalidates old OTP
// ==========================================================================

import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { generateSecureOtp, generateSalt, hashOtp } from '../_shared/crypto.ts';
import { getSmsProvider } from '../_shared/smsProvider.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

// @ts-ignore Deno serve API
Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { request_id } = body;

    if (!request_id || typeof request_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid request_id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch registration request
    const { data: requestRecord, error: fetchErr } = await supabaseAdmin
      .from('admin_registration_requests')
      .select('*')
      .eq('id', request_id)
      .maybeSingle();

    if (fetchErr || !requestRecord) {
      return new Response(JSON.stringify({ error: 'Registration request not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate current status
    if (requestRecord.status !== 'pending_founder_otp') {
      return new Response(JSON.stringify({ error: `Cannot resend OTP for request with status "${requestRecord.status}".` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Enforce 60-second cooldown
    const lastSentMs = new Date(requestRecord.last_sent_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - lastSentMs) / 1000);
    if (elapsedSeconds < 60) {
      return new Response(JSON.stringify({
        error: `Please wait ${60 - elapsedSeconds} seconds before requesting a new OTP.`,
        cooldown_remaining: 60 - elapsedSeconds,
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Enforce max 3 resends threshold
    if (requestRecord.resend_count >= 3) {
      return new Response(JSON.stringify({ error: 'Maximum resend limit (3) exceeded for this request. Please initiate a new registration.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Generate NEW OTP and Salt (invalidating the previous OTP)
    const newOtp = generateSecureOtp();
    const newSalt = generateSalt();
    // @ts-ignore Deno environment variables
    const serverPepper = Deno.env.get('OTP_SERVER_PEPPER') || 'campusnest_default_secure_pepper';
    const newOtpHash = await hashOtp(newOtp, newSalt, serverPepper);

    // Refresh TTL for 10 minutes from now
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 6. Update database record with new credentials
    const { error: updateErr } = await supabaseAdmin
      .from('admin_registration_requests')
      .update({
        otp_hash: newOtpHash,
        otp_salt: newSalt,
        resend_count: requestRecord.resend_count + 1,
        last_sent_at: new Date().toISOString(),
        expires_at: newExpiresAt,
      })
      .eq('id', request_id);

    if (updateErr) {
      console.error('Failed to update registration request on resend:', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to update request credentials.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Dispatch new OTP to Founder
    // @ts-ignore Deno environment variables
    const founderPhone = Deno.env.get('FOUNDER_PHONE_NUMBER') || '';
    if (!founderPhone) {
      return new Response(JSON.stringify({ error: 'Founder contact channel not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const smsProvider = getSmsProvider();
    const dispatchResult = await smsProvider.sendFounderOtp(
      founderPhone,
      requestRecord.full_name,
      requestRecord.username,
      newOtp
    );

    if (!dispatchResult.success) {
      return new Response(JSON.stringify({
        error: `SMS Gateway Error: ${dispatchResult.error || 'Failed to resend verification code to founder.'}`,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 8. Append Audit Log Record
    await supabaseAdmin.from('admin_registration_audit_logs').insert({
      request_id,
      event_type: 'founder_otp_dispatched',
      target_email: requestRecord.email,
      target_username: requestRecord.username,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {
        is_resend: true,
        resend_iteration: requestRecord.resend_count + 1,
        provider: smsProvider.name,
        dispatch_success: dispatchResult.success,
        message_id: dispatchResult.messageId || null,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      cooldown_seconds: 60,
      expires_in_seconds: 600,
      resends_remaining: 3 - (requestRecord.resend_count + 1),
      sms_configured: smsProvider.isConfigured,
      message: smsProvider.isConfigured
        ? 'New founder authorization OTP dispatched successfully.'
        : 'Request refreshed. SMS provider configuration required for mobile delivery.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unhandled error in admin-register-resend:', errorMsg);
    return new Response(JSON.stringify({ error: 'Internal server error processing resend.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
