// ==========================================================================
// CampusNest Edge Function: admin-register-request
// Phase 1 of Founder OTP Administrator Onboarding
// ==========================================================================

import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
import { generateSecureOtp, generateSalt, hashOtp, timingSafeEqual } from '../_shared/crypto.ts';
import { getSmsProvider } from '../_shared/smsProvider.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

// @ts-ignore Deno serve API
Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
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
    const {
      full_name,
      username,
      email,
      phone,
      founder_verification_number,
    } = body;

    // 2. Validate input fields
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Valid full name is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanUsername = (username || '').trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return new Response(JSON.stringify({ error: 'Username must be 3-20 characters using letters, numbers, or underscores.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return new Response(JSON.stringify({ error: 'Valid administrator email is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = (phone || '').replace(/[\s\-()]/g, '');
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      return new Response(JSON.stringify({ error: 'Valid 10-digit mobile phone number is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!founder_verification_number || typeof founder_verification_number !== 'string') {
      return new Response(JSON.stringify({ error: 'Founder verification clearance number is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate Founder Clearance Secret (Timing-safe comparison)
    // @ts-ignore Deno environment variables
    const founderSecret = Deno.env.get('FOUNDER_VERIFICATION_SECRET') || '';
    if (!founderSecret) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Founder clearance secret not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isClearanceValid = timingSafeEqual(founder_verification_number.trim(), founderSecret.trim());
    if (!isClearanceValid) {
      return new Response(JSON.stringify({ error: 'Invalid founder clearance key. Authorization denied.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore Deno environment variables
    const founderPhone = Deno.env.get('FOUNDER_PHONE_NUMBER') || '';
    if (!founderPhone) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Founder contact channel not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 4. Duplicate checks (Email, Username, Phone in profiles)
    const { data: existingProfile, error: profileCheckErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
      .maybeSingle();

    if (profileCheckErr) {
      console.warn('Profile check error:', profileCheckErr.message);
    }

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'An account with this email address or phone number already exists.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Cooldown check on active pending requests for same email
    const { data: recentPending } = await supabaseAdmin
      .from('admin_registration_requests')
      .select('id, last_sent_at, status')
      .eq('email', cleanEmail)
      .eq('status', 'pending_founder_otp')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentPending) {
      const lastSentTime = new Date(recentPending.last_sent_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastSentTime) / 1000);
      if (elapsedSeconds < 60) {
        return new Response(JSON.stringify({ 
          error: `Please wait ${60 - elapsedSeconds} seconds before requesting another OTP.`,
          cooldown_remaining: 60 - elapsedSeconds,
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 6. Generate cryptographically secure OTP & Salt
    const otp = generateSecureOtp();
    const salt = generateSalt();
    // @ts-ignore Deno environment variables
    const serverPepper = Deno.env.get('OTP_SERVER_PEPPER') || 'campusnest_default_secure_pepper';
    const otpHash = await hashOtp(otp, salt, serverPepper);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    // 7. Store pending registration request (Status: pending_founder_otp, TTL: 10 mins)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: requestRecord, error: insertError } = await supabaseAdmin
      .from('admin_registration_requests')
      .insert({
        full_name: full_name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        otp_hash: otpHash,
        otp_salt: salt,
        attempts: 0,
        max_attempts: 3,
        resend_count: 0,
        status: 'pending_founder_otp',
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt,
        ip_address: clientIp,
      })
      .select('id')
      .single();

    if (insertError || !requestRecord) {
      console.error('Failed to create registration request:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to initialize registration request.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 8. Dispatch OTP to the Founder's Phone Number via SMS Provider
    const smsProvider = getSmsProvider();
    const dispatchResult = await smsProvider.sendFounderOtp(
      founderPhone,
      full_name.trim(),
      cleanUsername,
      otp
    );

    if (!dispatchResult.success) {
      return new Response(JSON.stringify({
        error: `SMS Gateway Error: ${dispatchResult.error || 'Failed to dispatch verification code to founder.'}`,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 9. Append Audit Log Records (Zero secrets/OTPs logged)
    await supabaseAdmin.from('admin_registration_audit_logs').insert([
      {
        request_id: requestRecord.id,
        event_type: 'registration_requested',
        target_email: cleanEmail,
        target_username: cleanUsername,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: {
          full_name: full_name.trim(),
          phone_prefix: cleanPhone.slice(0, 3) + '***',
        },
      },
      {
        request_id: requestRecord.id,
        event_type: 'founder_otp_dispatched',
        target_email: cleanEmail,
        target_username: cleanUsername,
        ip_address: clientIp,
        user_agent: userAgent,
        metadata: {
          provider: smsProvider.name,
          dispatch_success: dispatchResult.success,
          message_id: dispatchResult.messageId || null,
        },
      },
    ]);

    // 10. Return success response to applicant
    return new Response(JSON.stringify({
      success: true,
      request_id: requestRecord.id,
      cooldown_seconds: 60,
      expires_in_seconds: 600,
      sms_configured: smsProvider.isConfigured,
      message: smsProvider.isConfigured
        ? 'Founder authorization OTP successfully dispatched to authorized founder channel.'
        : 'Registration request initialized. SMS provider configuration required for mobile delivery.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unhandled error in admin-register-request:', errorMsg);
    return new Response(JSON.stringify({ error: 'Internal server error processing registration request.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
