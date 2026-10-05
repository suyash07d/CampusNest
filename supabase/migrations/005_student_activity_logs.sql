-- ==========================================================================
-- CampusNest Migration 005: Student Activity Logs & Admin Intelligence (Hardened)
-- ==========================================================================
-- Description:
-- 1. Creates an immutable, append-only activity_logs table.
-- 2. Enforces actor_role database-side integrity via a BEFORE INSERT trigger
--    so that actor_role is derived directly from public.profiles and CANNOT be
--    spoofed or forged by client-provided payloads.
-- 3. Restricts Admin profile updates strictly to the `is_verified` moderation
--    field via a BEFORE UPDATE trigger, preventing arbitrary modification of
--    identity fields (id, email, full_name, phone, college_id, avatar_url)
--    and blocking unauthorized role mutations/escalations.
-- 4. Allows Admins to read student favourites for aggregate demand intelligence.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. CREATE ACTIVITY_LOGS TABLE
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('student', 'owner', 'admin')),
  action TEXT NOT NULL,
  target_type TEXT NULL,
  target_id UUID NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2. CREATE HIGH-PERFORMANCE INDEXES
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id 
  ON public.activity_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_role 
  ON public.activity_logs(actor_role);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action 
  ON public.activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_activity_logs_target_type 
  ON public.activity_logs(target_type);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
  ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_created 
  ON public.activity_logs(actor_id, created_at DESC);

-- --------------------------------------------------------------------------
-- 3. ACTOR_ROLE INTEGRITY TRIGGER (ISSUE 2 RESOLUTION)
-- --------------------------------------------------------------------------
-- Automatically derives and enforces actor_role from public.profiles.
-- Completely ignores client-supplied actor_role to prevent privilege spoofing.
CREATE OR REPLACE FUNCTION public.handle_activity_log_actor_role()
RETURNS TRIGGER AS $$
DECLARE
  actual_role TEXT;
BEGIN
  -- Guarantee actor_id matches the authenticated session caller
  IF NEW.actor_id IS NULL OR NEW.actor_id <> auth.uid() THEN
    RAISE EXCEPTION 'actor_id must match authenticated user ID.';
  END IF;

  -- Look up the verified role directly from public.profiles
  SELECT role INTO actual_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF actual_role IS NULL THEN
    RAISE EXCEPTION 'Actor profile does not exist in public.profiles.';
  END IF;

  -- Enforce authentic role from database (overwrites any client value)
  NEW.actor_role := actual_role;

  -- Enforce server timestamp
  NEW.created_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_activity_log_actor_role ON public.activity_logs;

CREATE TRIGGER enforce_activity_log_actor_role
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_activity_log_actor_role();

-- --------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) FOR ACTIVITY_LOGS
-- --------------------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_logs;
CREATE POLICY "Users can insert own activity" 
  ON public.activity_logs
  FOR INSERT 
  WITH CHECK (
    auth.uid() = actor_id
  );

DROP POLICY IF EXISTS "Users and Admins can view activity" ON public.activity_logs;
CREATE POLICY "Users and Admins can view activity" 
  ON public.activity_logs
  FOR SELECT 
  USING (
    auth.uid() = actor_id 
    OR public.is_admin()
  );

-- NOTE: NO UPDATE OR DELETE POLICIES.
-- Activity logs are strictly immutable and append-only.
-- Neither students, owners, nor admins can modify or delete historical records.

-- Permissions: Only authenticated users can insert/select according to RLS.
-- No public / anonymous access.
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- --------------------------------------------------------------------------
-- 5. PROFILES ADMIN UPDATE SECURITY (ISSUE 1 RESOLUTION)
-- --------------------------------------------------------------------------
-- Trigger that enforces:
-- a) id, email, and role can NEVER be mutated through standard updates.
-- b) When an admin updates another user's profile, ONLY is_verified may change.
-- c) Students/owners cannot update their own is_verified status.
-- d) Students/owners retain full ability to update their normal profile fields.
CREATE OR REPLACE FUNCTION public.handle_profile_security_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Disallow any mutation of id or email
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Profile ID cannot be modified.';
  END IF;

  IF NEW.email <> OLD.email THEN
    RAISE EXCEPTION 'Profile email cannot be modified directly.';
  END IF;

  -- 2. Disallow any mutation of role through standard application updates
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Profile role cannot be modified through standard update.';
  END IF;

  -- 3. If an Admin is updating another user's profile (auth.uid() <> OLD.id)
  IF auth.uid() <> OLD.id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can moderate user profiles.';
    END IF;

    -- Ensure identity and personal profile fields are completely untouched
    IF NEW.full_name <> OLD.full_name
       OR NEW.phone IS DISTINCT FROM OLD.phone
       OR NEW.college_id IS DISTINCT FROM OLD.college_id
       OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
      RAISE EXCEPTION 'Admins can only update the is_verified status of another user profile.';
    END IF;
  END IF;

  -- 4. Regular users cannot modify their own verification status
  IF auth.uid() = OLD.id AND NOT public.is_admin() THEN
    IF NEW.is_verified <> OLD.is_verified THEN
      RAISE EXCEPTION 'Users cannot modify their own verification status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_security_update ON public.profiles;

CREATE TRIGGER enforce_profile_security_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_security_update();

-- Admin RLS update policy for profiles (strictly constrained by the trigger above)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Admins can update profiles" 
  ON public.profiles
  FOR UPDATE 
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

-- --------------------------------------------------------------------------
-- 6. ADMIN RLS POLICIES FOR STUDENT FAVOURITES INTELLIGENCE
-- --------------------------------------------------------------------------
-- Allow admins to read student favourites for aggregate demand intelligence
-- while preserving strict student ownership for insertion and deletion.
DROP POLICY IF EXISTS "Students manage their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Students and Admins read favourites" ON public.favourites;
DROP POLICY IF EXISTS "Students manage own favourites" ON public.favourites;

CREATE POLICY "Students and Admins read favourites" 
  ON public.favourites
  FOR SELECT 
  USING (
    auth.uid() = student_id 
    OR public.is_admin()
  );

CREATE POLICY "Students manage own favourites" 
  ON public.favourites
  FOR ALL 
  USING (
    auth.uid() = student_id
  )
  WITH CHECK (
    auth.uid() = student_id
  );
