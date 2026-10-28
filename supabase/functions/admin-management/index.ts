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

    const { data: callerProfiles } = await supabaseAdmin
      .from('profiles')
      .select('role, can_manage_admins')
      .eq('id', caller.id);

    const callerProfile = callerProfiles?.[0];

    const isAuthorized = isPrimaryAdmin || (
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
        const isPrimary = profile.email?.toLowerCase() === 'suyashdhengle540@gmail.com';
        return {
          ...profile,
          status: isPrimary ? 'Primary Administrator' : (authUser?.email_confirmed_at ? 'Active' : 'Invite pending'),
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
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      return jsonResponse({ error: 'Enter a valid email address with a domain (e.g. name@gmail.com).' }, 400, headers);
    }

    // 1. Check existing accounts in profiles
    const { data: profileRows } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .ilike('email', email);

    const existingProfile = profileRows && profileRows.length > 0 ? profileRows[0] : null;

    // Check auth users
    let existingAuthUser = null;
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      existingAuthUser = authData?.users?.find((u) => (u.email || '').toLowerCase() === email) || null;
    } catch (listErr) {
      console.warn('Auth user list check notice:', listErr);
    }

    const siteUrl = (Deno.env.get('SITE_URL') || 'https://campus-nest-plum.vercel.app').replace(/\/$/, '');
    let actionLink: string | null = null;

    if (existingProfile || existingAuthUser) {
      // User ALREADY exists in CampusNest!
      const targetUserId = existingProfile?.id || existingAuthUser?.id;

      // Ensure they have the admin role in profiles
      const { error: upgradeProfileErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: targetUserId,
          email,
          full_name: fullName || existingProfile?.full_name || existingAuthUser?.user_metadata?.full_name,
          role: 'admin',
          is_verified: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (upgradeProfileErr) {
        console.error('Failed to upgrade profile to admin:', upgradeProfileErr.message);
        return jsonResponse({ error: `Could not finalize administrator account: ${upgradeProfileErr.message}` }, 500, headers);
      }

      // Update auth user metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            role: 'admin',
            full_name: fullName || existingProfile?.full_name || existingAuthUser?.user_metadata?.full_name,
          },
        });
      } catch (authMetaErr) {
        console.warn('Auth user metadata update notice:', authMetaErr);
      }

      // Generate direct setup link for existing user to set or reset their password
      try {
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${siteUrl}/admin`,
          },
        });
        if (!linkErr && linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
        }
      } catch (recoveryErr) {
        console.warn('generateLink recovery notice:', recoveryErr);
      }

      await supabaseAdmin.from('admin_access_events').insert({
        actor_id: caller.id,
        target_email: email,
        action: 'invite_sent',
        ip_address: clientIp,
      });

      return jsonResponse({
        success: true,
        email,
        invite_link: actionLink,
        message: `${fullName || existingProfile?.full_name || email} has been granted administrator access. Share the setup link below with them so they can choose their password.`,
      }, 200, headers);
    } else {
      // BRAND NEW USER
      let invitedUserId: string | null = null;

      // 1. Generate direct invite link
      try {
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { full_name: fullName, role: 'admin' },
            redirectTo: `${siteUrl}/admin`,
          },
        });
        if (!linkErr && linkData?.properties?.action_link) {
          actionLink = linkData.properties.action_link;
          invitedUserId = linkData.user?.id || null;
        }
      } catch (inviteErr) {
        console.warn('generateLink invite notice:', inviteErr);
      }

      // 2. Also try sending standard invite email via Supabase
      try {
        const { data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName, role: 'admin' },
          redirectTo: `${siteUrl}/admin`,
        });
        if (inviteData?.user && !invitedUserId) {
          invitedUserId = inviteData.user.id;
        }
      } catch (emailErr) {
        console.warn('inviteUserByEmail notice:', emailErr);
      }

      if (!invitedUserId) {
        return jsonResponse({
          error: 'Could not create administrator invitation link. Please verify the email and try again.',
        }, 500, headers);
      }

      // Upsert profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: invitedUserId,
          full_name: fullName,
          email,
          role: 'admin',
          is_verified: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Admin invite profile provisioning failed:', profileError.message);
        return jsonResponse({ error: `Could not finalize administrator account: ${profileError.message}` }, 500, headers);
      }

      await supabaseAdmin.from('admin_access_events').insert({
        actor_id: caller.id,
        target_email: email,
        action: 'invite_sent',
        ip_address: clientIp,
      });

      return jsonResponse({
        success: true,
        email,
        invite_link: actionLink,
        message: `Administrator invitation created for ${email}. Share the secure link below so they can set their password.`,
      }, 200, headers);
    }
  } catch (error) {
    console.error('Admin management request failed:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Administrator management is temporarily unavailable.' }, 500, headers);
  }
});
