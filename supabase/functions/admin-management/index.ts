import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://campus-nest-plum.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('origin');
  const allowedOrigin = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    (origin.endsWith('.vercel.app') && origin.includes('campus-nest'))
  ) ? origin : 'https://campus-nest-plum.vercel.app';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

const jsonResponse = (body: Record<string, unknown>, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, headers);
  }

  const bearer = req.headers.get('authorization') || '';
  const accessToken = bearer.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return jsonResponse({ error: 'Sign in with an administrator account to continue.' }, 401, headers);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Edge Function configuration is incomplete.');
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    const caller = userData?.user;
    if (userError || !caller) {
      return jsonResponse({ error: 'Your session is invalid or expired. Please sign in again.' }, 401, headers);
    }

    const callerEmail = (caller.email || '').toLowerCase().trim();
    const isPrimaryAdmin = callerEmail === 'suyashdhengle540@gmail.com';

    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('role, can_manage_admins')
      .eq('id', caller.id)
      .maybeSingle();

    const isAuthorized = isPrimaryAdmin || (
      !callerProfileError &&
      callerProfile?.role === 'admin' &&
      callerProfile?.can_manage_admins === true
    );

    if (!isAuthorized) {
      return jsonResponse({ error: 'Only the primary administrator can manage administrator access.' }, 403, headers);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;

    if (action === 'list') {
      const [{ data: profiles, error: profilesError }, { data: authUsers, error: authUsersError }] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id, full_name, email, created_at')
          .eq('role', 'admin')
          .order('created_at', { ascending: true })
          .limit(500),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);

      if (profilesError || authUsersError) {
        console.error('Admin list request failed:', profilesError?.message || authUsersError?.message);
        return jsonResponse({ error: 'Administrator accounts could not be loaded.' }, 500, headers);
      }

      const authUserById = new Map((authUsers?.users || []).map((user) => [user.id, user] as const));
      const administrators = (profiles || []).map((profile) => {
        const authUser = authUserById.get(profile.id);
        return {
          ...profile,
          status: authUser?.email_confirmed_at ? 'Active' : 'Invite pending',
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      });

      return jsonResponse({ administrators }, 200, headers);
    }

    if (action !== 'invite') {
      return jsonResponse({ error: 'Choose a supported administrator action.' }, 400, headers);
    }

    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (fullName.length < 2 || fullName.length > 120) {
      return jsonResponse({ error: 'Enter a name between 2 and 120 characters.' }, 400, headers);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Enter a valid email address.' }, 400, headers);
    }

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (existingProfileError) {
      console.error('Admin invite duplicate check failed:', existingProfileError.message);
      return jsonResponse({ error: 'The account could not be checked. Please try again.' }, 500, headers);
    }
    if (existingProfile) {
      return jsonResponse({ error: existingProfile.role === 'admin' ? 'This person is already an administrator.' : 'This email already belongs to a CampusNest account.' }, 409, headers);
    }

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://campus-nest-plum.vercel.app').replace(/\/$/, '');
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: 'admin' },
      redirectTo: `${siteUrl}/admin`,
    });

    if (inviteError || !inviteData?.user) {
      console.warn('Admin invitation failed:', inviteError?.message || 'No user returned.');
      const conflict = inviteError?.code === 'email_exists' || inviteError?.status === 422;
      return jsonResponse({ error: conflict ? 'This email is already registered. Ask that person to sign in with their existing account.' : 'The invitation email could not be sent. Check Supabase email settings and try again.' }, conflict ? 409 : 502, headers);
    }

    const invitedUser = inviteData.user;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: invitedUser.id,
        full_name: fullName,
        email,
        role: 'admin',
        is_verified: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Admin invite profile provisioning failed:', profileError.message);
      await supabaseAdmin.auth.admin.deleteUser(invitedUser.id);
      return jsonResponse({ error: 'The invite could not be finalized. No administrator account was added.' }, 500, headers);
    }

    const { error: auditError } = await supabaseAdmin.from('admin_access_events').insert({
      actor_id: caller.id,
      target_email: email,
      action: 'invite_sent',
      ip_address: clientIp,
    });
    if (auditError) console.warn('Admin invitation audit record failed:', auditError.message);

    return jsonResponse({
      success: true,
      email,
      message: 'Invitation sent. The administrator will set their password from the secure email link.',
    }, 200, headers);
  } catch (error) {
    console.error('Admin management request failed:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Administrator management is temporarily unavailable.' }, 500, headers);
  }
});
