-- ==========================================================================
-- CampusNest Migration 003: PostgREST Privileges & Schema Access
-- ==========================================================================
-- This migration grants the necessary table and schema access privileges to the
-- PostgREST API roles (`anon` and `authenticated`) while preserving 100% of the
-- existing Row-Level Security (RLS) policies across all 15 CampusNest tables.
--
-- Note on PostgreSQL Security:
-- Granting table-level privileges is a mandatory prerequisite for PostgREST.
-- RLS policies remain fully active (ENABLE ROW LEVEL SECURITY) on every table,
-- ensuring that actual row access and mutations are strictly enforced:
--   - Unauthenticated visitors (anon) can only read approved listings & directory data
--   - Students can only read/manage their own enquiries, favourites, and reviews
--   - PG Owners can only create and manage their own PG properties and rooms
--   - Admins retain full administrative oversight via public.is_admin()
-- ==========================================================================

-- 1. SCHEMA USAGE PRIVILEGES
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. DISCOVERY & READ-ONLY PRIVILEGES FOR UNLOGGED VISITORS (`anon`)
-- Unauthenticated students browsing the platform can read public directory data,
-- approved PGs, amenities, and public reviews as governed by existing RLS policies.
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.areas TO anon;
GRANT SELECT ON public.colleges TO anon;
GRANT SELECT ON public.amenities TO anon;
GRANT SELECT ON public.pg_listings TO anon;
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT ON public.pg_colleges TO anon;
GRANT SELECT ON public.pg_amenities TO anon;
GRANT SELECT ON public.pg_photos TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.profiles TO anon;

-- 3. DATA ACCESS PRIVILEGES FOR AUTHENTICATED USERS (`authenticated`)
-- Grants table DML rights to authenticated users. All actions remain strictly
-- constrained by the table RLS policies (e.g. students cannot edit PGs, users
-- cannot view others' enquiries, owners cannot modify others' properties).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colleges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_colleges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_amenities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pg_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favourites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;

-- 4. SEQUENCES PRIVILEGES
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5. FUNCTION EXECUTION PRIVILEGES
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated;

-- 6. DEFAULT PRIVILEGES FOR FUTURE OBJECTS
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT EXECUTE ON ROUTINES TO anon, authenticated;
