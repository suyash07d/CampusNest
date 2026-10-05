/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authError from URL params (e.g. expired otp or invalid link)
  const [authError, setAuthError] = useState(() => {
    if (typeof window === 'undefined') return null;
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search || '');
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code');

    if (errorDesc || errorCode) {
      const rawMsg = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Email verification link is invalid or has expired.';
      if (errorCode === 'otp_expired' || rawMsg.toLowerCase().includes('expired')) {
        return 'Your email verification link has expired or has already been used. Please log in or request a new confirmation email.';
      }
      return rawMsg;
    }
    return null;
  });

  // Initialize authNotice from URL confirmation hash/query
  const [authNotice, setAuthNotice] = useState(() => {
    if (typeof window === 'undefined') return null;
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search || '');
    const type = hashParams.get('type');
    if (type === 'signup' || type === 'email_change' || searchParams.has('code')) {
      return '🎉 Email confirmed successfully! Welcome to your CampusNest dashboard.';
    }
    return null;
  });

  // Helper to fetch user's record from public.profiles
  const fetchProfile = useCallback(async (userId, fallbackUser = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      // 1. Query existing row in public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Notice querying profiles table:', error.message);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // 2. If row does not exist yet (e.g. freshly confirmed signup), create profile from user metadata
      if (fallbackUser) {
        const meta = fallbackUser.user_metadata || {};
        // SECURITY: Role strictly locked to 'student' or 'owner'. Never 'admin'.
        const safeRole = meta.role === 'owner' ? 'owner' : 'student';
        const cleanFullName = (meta.full_name || '').trim() || fallbackUser.email?.split('@')[0] || 'CampusNest User';

        const newProfile = {
          id: userId,
          email: fallbackUser.email || '',
          full_name: cleanFullName,
          role: safeRole,
          phone: meta.phone || null,
          is_verified: true,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .maybeSingle();

        if (insertError) {
          console.warn('Notice writing profile row (using in-memory profile):', insertError.message);
          setProfile(newProfile);
          return newProfile;
        }

        if (inserted) {
          setProfile(inserted);
          return inserted;
        }
      }

      setProfile(null);
      return null;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize session and listen for auth state transitions (including confirmation redirects)
  useEffect(() => {
    let mounted = true;

    // Clean up hash from URL if error was detected so it doesn't linger
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      if (hashParams.get('error_description') || hashParams.get('error_code')) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error reading initial session:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id, initialSession.user);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes (login, logout, token refresh, email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
        if (event === 'SIGNED_IN') {
          // If coming from email confirmation, clean hash from URL
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
            setAuthNotice('🎉 Email confirmed successfully! Welcome to your CampusNest dashboard.');
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up with Email + Password
  const signUp = async ({ email, password, fullName, role, phone }) => {
    // SECURITY: Strictly enforce role can ONLY be 'student' or 'owner'.
    // Admin role is NEVER permitted from public frontend signup.
    const safeRole = role === 'owner' ? 'owner' : 'student';
    const cleanName = (fullName || '').trim() || (safeRole === 'owner' ? 'PG Host' : 'Student');

    // Use current origin so confirmation redirects to actual dev server URL (e.g. http://localhost:5173/)
    const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: cleanName,
          role: safeRole,
          phone: phone || null,
        },
      },
    });

    if (error) {
      throw error;
    }

    // If session is immediately active (email confirmation disabled in Supabase)
    if (data?.user && data?.session) {
      const profileData = {
        id: data.user.id,
        email: data.user.email,
        full_name: cleanName,
        role: safeRole,
        phone: phone || null,
        is_verified: false,
      };

      const { data: createdProfile, error: profileErr } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .maybeSingle();

      if (!profileErr && createdProfile) {
        setProfile(createdProfile);
      } else {
        setProfile(profileData);
      }

      return {
        user: data.user,
        session: data.session,
        profile: createdProfile || profileData,
        role: safeRole,
        needsEmailVerification: false,
      };
    }

    // If confirmation email is required
    return {
      user: data.user,
      session: null,
      role: safeRole,
      needsEmailVerification: true,
    };
  };

  // Sign in with Email + Password
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      const userProfile = await fetchProfile(data.user.id, data.user);
      return {
        user: data.user,
        session: data.session,
        profile: userProfile,
      };
    }

    return data;
  };

  // Dedicated Admin Sign In with authoritative database role verification
  const signInAdmin = async ({ email, password }) => {
    // 1. Authenticate with Supabase credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error('Authentication failed: No user record returned.');
    }

    // 2. Fetch authoritative profile directly from public.profiles
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr) {
      await signOut();
      throw new Error('Authorization check failed. Please check network connectivity.');
    }

    // 3. Strict Role Verification: MUST be 'admin'
    if (!profileRow || profileRow.role !== 'admin') {
      // Immediately revoke session to prevent any non-admin access
      await signOut();
      const detectedRole = profileRow?.role || 'user';
      throw new Error(`Admin access required. Account authenticated as "${detectedRole}", but lacks administrative privileges.`);
    }

    setUser(data.user);
    setSession(data.session);
    setProfile(profileRow);

    return {
      user: data.user,
      session: data.session,
      profile: profileRow,
    };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Error signing out:', error.message);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthNotice(null);
    setAuthError(null);
  };

  // Derived role (profile role -> user_metadata role -> default 'student')
  const role = profile?.role || user?.user_metadata?.role || 'student';

  const value = {
    user,
    session,
    profile,
    role,
    isAdmin: profile?.role === 'admin',
    loading,
    isAuthenticated: !!user,
    authError,
    authNotice,
    clearAuthError: () => setAuthError(null),
    clearAuthNotice: () => setAuthNotice(null),
    signUp,
    signIn,
    signInAdmin,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id, user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
