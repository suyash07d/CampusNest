-- ==========================================================================
-- CampusNest — Complete Relational PostgreSQL Schema & RLS Setup
-- Designed for Supabase / PostgreSQL (Maharashtra Student PG Discovery)
-- ==========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================================
-- 0. HELPER FUNCTIONS & TRIGGERS
-- ==========================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Forward declaration of is_admin function (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================================
-- 1. CITIES TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 2. AREAS TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  pincode VARCHAR(10),
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_area_slug_per_city UNIQUE (city_id, slug)
);

-- ==========================================================================
-- 3. COLLEGES TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  short_name VARCHAR(50),
  slug VARCHAR(200) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 4. PROFILES TABLE (Linked 1:1 with auth.users)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'owner', 'admin')),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 5. PG_LISTINGS TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.pg_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  gender_type VARCHAR(20) NOT NULL CHECK (gender_type IN ('boys', 'girls', 'coed')),
  starting_monthly_rent INTEGER NOT NULL CHECK (starting_monthly_rent > 0),
  security_deposit INTEGER NOT NULL DEFAULT 0,
  notice_period_days INTEGER DEFAULT 30,
  food_available BOOLEAN NOT NULL DEFAULT true,
  food_type VARCHAR(30) DEFAULT 'both' CHECK (food_type IN ('veg', 'non_veg', 'both', 'none')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  curfew_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_pg_listings_updated_at
  BEFORE UPDATE ON public.pg_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 6. PG_COLLEGES TABLE (Proximity & Walking Distance)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.pg_colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  distance_meters INTEGER NOT NULL CHECK (distance_meters >= 0),
  walking_time_mins INTEGER NOT NULL CHECK (walking_time_mins >= 0),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pg_college_mapping UNIQUE (pg_id, college_id)
);

-- ==========================================================================
-- 7. ROOMS TABLE (Sharing Options & Capacities)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  room_type VARCHAR(30) NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'four_sharing')),
  monthly_rent INTEGER NOT NULL CHECK (monthly_rent > 0),
  total_beds INTEGER NOT NULL CHECK (total_beds > 0),
  available_beds INTEGER NOT NULL CHECK (available_beds >= 0 AND available_beds <= total_beds),
  has_attached_washroom BOOLEAN NOT NULL DEFAULT true,
  has_ac BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 8. AMENITIES TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'utility',
  icon_key VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 9. PG_AMENITIES TABLE (Bridge Table)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.pg_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pg_amenity_mapping UNIQUE (pg_id, amenity_id)
);

-- ==========================================================================
-- 10. PG_PHOTOS TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.pg_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption VARCHAR(120),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 11. ENQUIRIES TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  room_type_preference VARCHAR(30),
  visit_date DATE,
  message TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'visit_scheduled', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 12. FAVOURITES TABLE (Student Wishlists)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_pg_favourite UNIQUE (student_id, pg_id)
);

-- ==========================================================================
-- 13. REVIEWS TABLE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  food_rating SMALLINT CHECK (food_rating >= 1 AND food_rating <= 5),
  wifi_rating SMALLINT CHECK (wifi_rating >= 1 AND wifi_rating <= 5),
  review_text TEXT NOT NULL,
  is_verified_tenant BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_pg_review UNIQUE (student_id, pg_id)
);

-- ==========================================================================
-- 14. REPORTS TABLE (Safety & Trust)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pg_id UUID NOT NULL REFERENCES public.pg_listings(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 15. ADMIN_ACTIONS TABLE (Audit Logs)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action VARCHAR(60) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- 16. INDEXES FOR HIGH QUERY PERFORMANCE
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON public.areas(city_id);
CREATE INDEX IF NOT EXISTS idx_colleges_area_id ON public.colleges(area_id);
CREATE INDEX IF NOT EXISTS idx_pg_listings_area_id ON public.pg_listings(area_id);
CREATE INDEX IF NOT EXISTS idx_pg_listings_owner_id ON public.pg_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_pg_listings_status ON public.pg_listings(status);
CREATE INDEX IF NOT EXISTS idx_pg_colleges_pg_id ON public.pg_colleges(pg_id);
CREATE INDEX IF NOT EXISTS idx_pg_colleges_college_id ON public.pg_colleges(college_id);
CREATE INDEX IF NOT EXISTS idx_rooms_pg_id ON public.rooms(pg_id);
CREATE INDEX IF NOT EXISTS idx_pg_amenities_pg_id ON public.pg_amenities(pg_id);
CREATE INDEX IF NOT EXISTS idx_pg_photos_pg_id ON public.pg_photos(pg_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_student_id ON public.enquiries(student_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_pg_id ON public.enquiries(pg_id);
CREATE INDEX IF NOT EXISTS idx_favourites_student_id ON public.favourites(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_pg_id ON public.reviews(pg_id);
CREATE INDEX IF NOT EXISTS idx_reports_pg_id ON public.reports(pg_id);

-- ==========================================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

-- Enable RLS across all 15 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- RLS: CITIES, AREAS, COLLEGES, AMENITIES (Public Read, Admin Write)
-- --------------------------------------------------------------------------
CREATE POLICY "Public read active cities" ON public.cities
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage cities" ON public.cities
  FOR ALL USING (public.is_admin());

CREATE POLICY "Public read areas" ON public.areas
  FOR SELECT USING (true);

CREATE POLICY "Admin manage areas" ON public.areas
  FOR ALL USING (public.is_admin());

CREATE POLICY "Public read colleges" ON public.colleges
  FOR SELECT USING (true);

CREATE POLICY "Admin manage colleges" ON public.colleges
  FOR ALL USING (public.is_admin());

CREATE POLICY "Public read amenities" ON public.amenities
  FOR SELECT USING (true);

CREATE POLICY "Admin manage amenities" ON public.amenities
  FOR ALL USING (public.is_admin());

-- --------------------------------------------------------------------------
-- RLS: PROFILES
-- --------------------------------------------------------------------------
CREATE POLICY "Public read basic profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------------
-- RLS: PG_LISTINGS (Approved is public, Owners manage their own, Admin all)
-- --------------------------------------------------------------------------
CREATE POLICY "Public can view approved PGs" ON public.pg_listings
  FOR SELECT USING (
    status = 'approved' 
    OR auth.uid() = owner_id 
    OR public.is_admin()
  );

CREATE POLICY "Owners can insert their own PG" ON public.pg_listings
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

CREATE POLICY "Owners can update their own PG" ON public.pg_listings
  FOR UPDATE USING (
    auth.uid() = owner_id OR public.is_admin()
  );

CREATE POLICY "Owners can delete their own PG" ON public.pg_listings
  FOR DELETE USING (
    auth.uid() = owner_id OR public.is_admin()
  );

-- --------------------------------------------------------------------------
-- RLS: PG SUB-ENTITIES (rooms, pg_colleges, pg_photos, pg_amenities)
-- --------------------------------------------------------------------------
-- Viewable if parent PG is approved or caller is owner / admin
CREATE POLICY "Read rooms for viewable PGs" ON public.rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (status = 'approved' OR owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Owners manage their PG rooms" ON public.rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Read pg_colleges for viewable PGs" ON public.pg_colleges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (status = 'approved' OR owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Owners manage their PG colleges" ON public.pg_colleges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Read pg_photos for viewable PGs" ON public.pg_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (status = 'approved' OR owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Owners manage their PG photos" ON public.pg_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Read pg_amenities for viewable PGs" ON public.pg_amenities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (status = 'approved' OR owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Owners manage their PG amenities" ON public.pg_amenities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (owner_id = auth.uid() OR public.is_admin())
    )
  );

-- --------------------------------------------------------------------------
-- RLS: ENQUIRIES
-- --------------------------------------------------------------------------
CREATE POLICY "Students view their own enquiries" ON public.enquiries
  FOR SELECT USING (
    auth.uid() = student_id 
    OR EXISTS (SELECT 1 FROM public.pg_listings WHERE id = pg_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Students can submit enquiries" ON public.enquiries
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
  );

CREATE POLICY "Owners and Admins can update enquiry status" ON public.enquiries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pg_listings WHERE id = pg_id AND owner_id = auth.uid())
    OR public.is_admin()
  );

-- --------------------------------------------------------------------------
-- RLS: FAVOURITES
-- --------------------------------------------------------------------------
CREATE POLICY "Students manage their own favourites" ON public.favourites
  FOR ALL USING (
    auth.uid() = student_id
  );

-- --------------------------------------------------------------------------
-- RLS: REVIEWS
-- --------------------------------------------------------------------------
CREATE POLICY "Anyone can read reviews for approved PGs" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pg_listings
      WHERE id = pg_id AND (status = 'approved' OR owner_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Students can create and update own review" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
  );

CREATE POLICY "Students can update own review" ON public.reviews
  FOR UPDATE USING (
    auth.uid() = student_id
  );

-- --------------------------------------------------------------------------
-- RLS: REPORTS
-- --------------------------------------------------------------------------
CREATE POLICY "Students can view their submitted reports" ON public.reports
  FOR SELECT USING (
    auth.uid() = reporter_id OR public.is_admin()
  );

CREATE POLICY "Students can file reports" ON public.reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id
  );

CREATE POLICY "Admins can update report status" ON public.reports
  FOR UPDATE USING (
    public.is_admin()
  );

-- --------------------------------------------------------------------------
-- RLS: ADMIN_ACTIONS
-- --------------------------------------------------------------------------
CREATE POLICY "Admins full access to audit actions" ON public.admin_actions
  FOR ALL USING (
    public.is_admin()
  );
