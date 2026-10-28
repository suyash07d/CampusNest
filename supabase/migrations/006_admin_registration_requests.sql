-- ==========================================================================
-- CampusNest Migration 006: Admin Registration & Founder OTP Architecture
-- Secure Onboarding Infrastructure, Request Lifecycle & Audit Logging
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. ADMIN REGISTRATION REQUESTS TABLE
-- --------------------------------------------------------------------------
-- Tracks transient administrator onboarding requests and hashed OTP states.
-- Strictly accessible only via backend Service Role / verified Administrators.
CREATE TABLE IF NOT EXISTS public.admin_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  otp_hash TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  resend_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_founder_otp' 
    CHECK (status IN ('pending_founder_otp', 'verified', 'completed', 'expired', 'locked')),
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  created_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT chk_attempts_bounds CHECK (attempts >= 0 AND attempts <= max_attempts),
  CONSTRAINT chk_resend_bounds CHECK (resend_count >= 0)
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_admin_reg_email 
  ON public.admin_registration_requests(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_admin_reg_username 
  ON public.admin_registration_requests(LOWER(username));

CREATE INDEX IF NOT EXISTS idx_admin_reg_status 
  ON public.admin_registration_requests(status);

CREATE INDEX IF NOT EXISTS idx_admin_reg_expires 
  ON public.admin_registration_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_reg_created 
  ON public.admin_registration_requests(created_at DESC);

-- --------------------------------------------------------------------------
-- 2. ADMIN REGISTRATION AUDIT LOGS TABLE
-- --------------------------------------------------------------------------
-- Immutable append-only audit trail for onboarding milestones.
-- NEVER stores passwords, plaintext OTPs, or auth tokens.
CREATE TABLE IF NOT EXISTS public.admin_registration_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.admin_registration_requests(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL 
    CHECK (event_type IN (
      'registration_requested', 
      'founder_otp_dispatched', 
      'otp_failed', 
      'otp_verified', 
      'admin_created'
    )),
  target_email VARCHAR(255) NOT NULL,
  target_username VARCHAR(50) NOT NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_admin_reg_audit_req_id 
  ON public.admin_registration_audit_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_admin_reg_audit_email 
  ON public.admin_registration_audit_logs(LOWER(target_email));

CREATE INDEX IF NOT EXISTS idx_admin_reg_audit_event 
  ON public.admin_registration_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_admin_reg_audit_created 
  ON public.admin_registration_audit_logs(created_at DESC);

-- --------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) LOCKDOWN
-- --------------------------------------------------------------------------
-- Enable RLS on both tables
ALTER TABLE public.admin_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_registration_audit_logs ENABLE ROW LEVEL SECURITY;

-- Block all anonymous and standard public access.
-- Only authenticated Administrators can view onboarding history.
-- Service Role bypasses RLS for Edge Function operations.
DROP POLICY IF EXISTS "Admins can view registration requests" ON public.admin_registration_requests;
CREATE POLICY "Admins can view registration requests"
  ON public.admin_registration_requests
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view registration audit logs" ON public.admin_registration_audit_logs;
CREATE POLICY "Admins can view registration audit logs"
  ON public.admin_registration_audit_logs
  FOR SELECT
  USING (public.is_admin());

-- Revoke all public write permissions; grants SELECT strictly to authenticated for admin view
REVOKE ALL ON public.admin_registration_requests FROM anon, public;
REVOKE ALL ON public.admin_registration_audit_logs FROM anon, public;
GRANT SELECT ON public.admin_registration_requests TO authenticated;
GRANT SELECT ON public.admin_registration_audit_logs TO authenticated;

-- --------------------------------------------------------------------------
-- 4. PROFILES TABLE INSERT ROLE GUARD (ANTI-SPOOFING TRIGGER)
-- --------------------------------------------------------------------------
-- Prevents any client (authenticated or anon) from inserting role = 'admin' directly.
-- Only the service_role executing from trusted Edge Functions can assign 'admin'.
CREATE OR REPLACE FUNCTION public.handle_profile_insert_role_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is 'admin', strictly block any non-service-role caller
  IF NEW.role = 'admin' AND (auth.role() = 'anon' OR auth.role() = 'authenticated') THEN
    RAISE EXCEPTION 'Security Violation: Administrator profiles cannot be created through public endpoints.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_insert_role_guard ON public.profiles;

CREATE TRIGGER enforce_profile_insert_role_guard
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_insert_role_guard();
