-- Audit administrator invitations without storing passwords or invite tokens.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_manage_admins BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed the existing primary administrator. If this account is not present yet,
-- set the flag for the correct admin account once it has been provisioned.
UPDATE public.profiles
SET can_manage_admins = TRUE
WHERE LOWER(email) = 'suyashdhengle540@gmail.com'
  AND role = 'admin';

CREATE OR REPLACE FUNCTION public.guard_admin_management_permission()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.can_manage_admins IS TRUE AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only the trusted server can grant admin management permission.';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.can_manage_admins IS DISTINCT FROM OLD.can_manage_admins
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only the trusted server can change admin management permission.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_admin_management_permission_insert ON public.profiles;
CREATE TRIGGER guard_admin_management_permission_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_admin_management_permission();

DROP TRIGGER IF EXISTS guard_admin_management_permission_update ON public.profiles;
CREATE TRIGGER guard_admin_management_permission_update
  BEFORE UPDATE OF can_manage_admins ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_admin_management_permission();

CREATE TABLE IF NOT EXISTS public.admin_access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email VARCHAR(255) NOT NULL,
  action VARCHAR(40) NOT NULL CHECK (action IN ('invite_sent')),
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_access_events_created_at
  ON public.admin_access_events(created_at DESC);

ALTER TABLE public.admin_access_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_access_events FROM anon, authenticated, public;
GRANT ALL ON public.admin_access_events TO service_role;
