// ==========================================================================
// CampusNest Edge Function: admin-register-verify
// Phase 2 of Founder OTP Administrator Onboarding
// Verifies OTP, enforces attempt caps, and securely provisions admin account
// ==========================================================================

import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyOtpHash } from '../_shared/crypto.ts';
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
    const { request_id, otp, password } = body;

    // 1. Validate payload
    if (!request_id || typeof request_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid request_id is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanOtp = (otp || '').trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return new Response(JSON.stringify({ error: 'OTP must be a 6-digit numeric code.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Fetch active registration request
    const { data: requestRecord, error: fetchErr } = await supabaseAdmin
      .from('admin_registration_requests')
      .select('*')
      .eq('id', request_id)
      .maybeSingle();

    if (fetchErr || !requestRecord) {
      return new Response(JSON.stringify({ error: 'Registration request not found or invalid.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Status checks
    if (requestRecord.status === 'completed' || requestRecord.status === 'verified') {
      return new Response(JSON.stringify({ error: 'This registration request has already been verified and processed.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (requestRecord.status === 'locked') {
      return new Response(JSON.stringify({ error: 'This registration request is permanently locked due to excessive failed attempts. Please submit a new request.' }), {
        status: 423,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (requestRecord.status === 'expired') {
      return new Response(JSON.stringify({ error: 'This registration request has expired. Please submit a new request.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Expiration check (10-minute TTL)
    if (new Date(requestRecord.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from('admin_registration_requests')
        .update({ status: 'expired' })
        .eq('id', request_id);

      await supabaseAdmin.from('admin_registration_audit_logs').insert({
        request_id,
        event_type: 'otp_failed',
        target_email: requestRecord.email,
        target_username: requestRecord.username,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: { reason: 'otp_expired' },
      });

      return new Response(JSON.stringify({ error: 'The verification OTP has expired. Please request a new code.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Attempt threshold check
    if (requestRecord.attempts >= requestRecord.max_attempts) {
      await supabaseAdmin
        .from('admin_registration_requests')
        .update({ status: 'locked' })
        .eq('id', request_id);

      return new Response(JSON.stringify({ error: 'Maximum verification attempts exceeded. Request is locked.' }), {
        status: 423,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Timing-Safe HMAC-SHA256 OTP Verification
    // @ts-ignore Deno environment variables
    const serverPepper = Deno.env.get('OTP_SERVER_PEPPER') || 'campusnest_default_secure_pepper';
    const isOtpValid = await verifyOtpHash(
      cleanOtp,
      requestRecord.otp_salt,
      serverPepper,
      requestRecord.otp_hash
    );

    if (!isOtpValid) {
      const newAttempts = requestRecord.attempts + 1;
      const isNowLocked = newAttempts >= requestRecord.max_attempts;

      await supabaseAdmin
        .from('admin_registration_requests')
        .update({
          attempts: newAttempts,
          status: isNowLocked ? 'locked' : requestRecord.status,
        })
        .eq('id', request_id);

      await supabaseAdmin.from('admin_registration_audit_logs').insert({
        request_id,
        event_type: 'otp_failed',
        target_email: requestRecord.email,
        target_username: requestRecord.username,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: {
          attempt_number: newAttempts,
          is_locked: isNowLocked,
        },
      });

      const remainingAttempts = Math.max(0, requestRecord.max_attempts - newAttempts);
      return new Response(JSON.stringify({
        error: isNowLocked
          ? 'Maximum verification attempts exceeded. Request has been locked.'
          : `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        remaining_attempts: remainingAttempts,
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. OTP is Valid -> Mark Verified
    await supabaseAdmin
      .from('admin_registration_requests')
      .update({ status: 'verified' })
      .eq('id', request_id);

    await supabaseAdmin.from('admin_registration_audit_logs').insert({
      request_id,
      event_type: 'otp_verified',
      target_email: requestRecord.email,
      target_username: requestRecord.username,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: { verification_success: true },
    });

    // 8. Provision Supabase Auth User with Privileged Service Role
    const { data: createdAuthUser, error: authUserErr } = await supabaseAdmin.auth.admin.createUser({
      email: requestRecord.email,
      password: password,
      email_confirm: true, // Auto-confirm since vetted by Founder OTP
      user_metadata: {
        full_name: requestRecord.full_name,
        username: requestRecord.username,
        phone: requestRecord.phone,
        role: 'admin',
      },
    });

    if (authUserErr || !createdAuthUser?.user) {
      console.error('Failed to create auth user:', authUserErr);
      return new Response(JSON.stringify({ error: `User provisioning error: ${authUserErr?.message || 'Unknown'}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = createdAuthUser.user.id;

    // 9. Upsert public.profiles with Authoritative role = 'admin'
    const { error: profileUpsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email: requestRecord.email,
        full_name: requestRecord.full_name,
        phone: requestRecord.phone,
        role: 'admin',
        is_verified: true,
        updated_at: new Date().toISOString(),
      });

    if (profileUpsertErr) {
      console.error('Failed to insert admin profile:', profileUpsertErr);
      return new Response(JSON.stringify({ error: 'Failed to configure administrative profile role.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 10. Finalize Registration Request Record
    await supabaseAdmin
      .from('admin_registration_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_user_id: newUserId,
      })
      .eq('id', request_id);

    // 11. Record Final Milestone in Audit Logs
    await supabaseAdmin.from('admin_registration_audit_logs').insert({
      request_id,
      event_type: 'admin_created',
      target_email: requestRecord.email,
      target_username: requestRecord.username,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {
        admin_user_id: newUserId,
        provisioned_role: 'admin',
      },
    });

    // 12. Return Success to Frontend
    return new Response(JSON.stringify({
      success: true,
      message: 'Administrator account provisioned successfully. You may now log in to the CampusNest Terminal.',
      email: requestRecord.email,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unhandled error in admin-register-verify:', errorMsg);
    return new Response(JSON.stringify({ error: 'Internal server error verifying registration OTP.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
