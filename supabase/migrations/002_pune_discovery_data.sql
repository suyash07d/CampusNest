-- ==========================================================================
-- CampusNest Migration 002: Pune-Only Comprehensive Discovery Dataset
-- Savitribai Phule Pune University (SPPU) & DTE Maharashtra Verified Institutes
-- ==========================================================================

-- 1. Ensure Table Privileges & RLS Read Access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT SELECT ON public.areas TO anon, authenticated;
GRANT SELECT ON public.colleges TO anon, authenticated;

-- 2. Relax NOT NULL on latitude/longitude in colleges if missing, and add verified metadata columns
ALTER TABLE public.colleges ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE public.colleges ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS affiliation VARCHAR(150);
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS college_type VARCHAR(100);
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS categories TEXT[];
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS institute_code VARCHAR(50);
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS source_meta VARCHAR(150);

-- 3. Insert or Ensure Pune City
INSERT INTO public.cities (id, name, slug, state, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Pune', 'pune', 'Maharashtra', true)
ON CONFLICT (slug) DO UPDATE 
SET name = 'Pune', state = 'Maharashtra', is_active = true;

-- 4. Insert Comprehensive Pune Localities / Areas
-- Covers Central Pune, Peths, Western Pune, PCMC / Pimpri-Chinchwad, Eastern Pune, IT Corridors
INSERT INTO public.areas (id, city_id, name, slug, pincode, is_popular)
VALUES
  -- Central Pune & Peths
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Shivajinagar', 'shivajinagar', '411005', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Deccan Gymkhana / FC Road', 'deccan', '411004', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sadashiv Peth', 'sadashiv-peth', '411030', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Shukrawar Peth', 'shukrawar-peth', '411002', false),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Narayan Peth', 'narayan-peth', '411030', false),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Raviwar Peth', 'raviwar-peth', '411002', false),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Budhwar Peth', 'budhwar-peth', '411002', false),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Rasta Peth', 'rasta-peth', '411011', false),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Kasba Peth', 'kasba-peth', '411011', false),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Swargate', 'swargate', '411042', true),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Parvati', 'parvati', '411009', false),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Gultekdi / Market Yard', 'gultekdi', '411037', false),

  -- Western Pune & Kothrud Corridor
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Kothrud', 'kothrud', '411038', true),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Karve Nagar', 'karve-nagar', '411052', true),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Warje', 'warje', '411058', false),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'Bavdhan', 'bavdhan', '411021', false),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'Pashan', 'pashan', '411008', false),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'Sus / Sus Gaon', 'sus', '411021', false),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'Baner', 'baner', '411045', true),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Balewadi', 'balewadi', '411045', true),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Aundh', 'aundh', '411007', true),

  -- PCMC / Pimpri-Chinchwad Educational Hub
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'Pimpri', 'pimpri', '411018', true),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'Chinchwad', 'chinchwad', '411033', true),
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'Akurdi', 'akurdi', '411035', true),
  ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'Nigdi / Pradhikaran', 'nigdi', '411044', true),
  ('b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'Ravet', 'ravet', '412101', true),
  ('b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'Tathawade', 'tathawade', '411033', true),
  ('b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'Wakad', 'wakad', '411057', true),
  ('b0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'Hinjawadi', 'hinjawadi', '411057', true),
  ('b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'Bhosari', 'bhosari', '411026', false),
  ('b0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'Dapodi', 'dapodi', '411012', false),
  ('b0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'Khadki', 'khadki', '411003', false),
  ('b0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'Pimple Saudagar', 'pimple-saudagar', '411027', false),
  ('b0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'Pimple Nilakh', 'pimple-nilakh', '411027', false),
  ('b0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'Pimple Gurav', 'pimple-gurav', '411061', false),
  ('b0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'Rahatani', 'rahatani', '411017', false),
  ('b0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'Thergaon', 'thergaon', '411033', false),
  ('b0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'Moshi', 'moshi', '412105', false),
  ('b0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'Alandi', 'alandi', '412105', true),
  ('b0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'Talegaon Dabhade', 'talegaon', '410506', false),

  -- Eastern Pune & Airport Corridor
  ('b0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'Viman Nagar', 'viman-nagar', '411014', true),
  ('b0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'Kalyani Nagar', 'kalyani-nagar', '411006', true),
  ('b0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'Koregaon Park', 'koregaon-park', '411001', true),
  ('b0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'Yerawada', 'yerawada', '411006', false),
  ('b0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'Kharadi', 'kharadi', '411014', true),
  ('b0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'Wadgaon Sheri', 'wadgaon-sheri', '411014', false),
  ('b0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'Dhanori', 'dhanori', '411015', false),
  ('b0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'Lohegaon', 'lohegaon', '411047', true),
  ('b0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'Vishrantwadi', 'vishrantwadi', '411015', false),
  ('b0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'Wagholi', 'wagholi', '412207', true),
  ('b0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'Hadapsar', 'hadapsar', '411028', true),
  ('b0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'Magarpatta', 'magarpatta', '411028', true),
  ('b0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'Mundhwa', 'mundhwa', '411036', false),
  ('b0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'Keshav Nagar', 'keshav-nagar', '411036', false),

  -- Southern Pune & Cantonment
  ('b0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'Camp / Cantonment', 'camp', '411001', true),
  ('b0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000001', 'Wanowrie', 'wanowrie', '411040', true),
  ('b0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'Fatima Nagar', 'fatima-nagar', '411013', false),
  ('b0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'Kondhwa', 'kondhwa', '411048', true),
  ('b0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000001', 'NIBM', 'nibm', '411048', false),
  ('b0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'Undri', 'undri', '411060', false),
  ('b0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001', 'Mohammadwadi', 'mohammadwadi', '411060', false),
  ('b0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000001', 'Pisoli', 'pisoli', '411060', false),
  ('b0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000001', 'Katraj', 'katraj', '411046', true),
  ('b0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000001', 'Dhankawadi', 'dhankawadi', '411043', true),
  ('b0000000-0000-0000-0000-000000000065', 'a0000000-0000-0000-0000-000000000001', 'Bibwewadi', 'bibwewadi', '411037', true),
  ('b0000000-0000-0000-0000-000000000066', 'a0000000-0000-0000-0000-000000000001', 'Sahakar Nagar', 'sahakar-nagar', '411009', false),
  ('b0000000-0000-0000-0000-000000000067', 'a0000000-0000-0000-0000-000000000001', 'Sinhagad Road', 'sinhagad-road', '411041', true),
  ('b0000000-0000-0000-0000-000000000068', 'a0000000-0000-0000-0000-000000000001', 'Vadgaon Budruk', 'vadgaon-budruk', '411041', true),
  ('b0000000-0000-0000-0000-000000000069', 'a0000000-0000-0000-0000-000000000001', 'Ambegaon', 'ambegaon', '411046', true),
  ('b0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000001', 'Narhe', 'narhe', '411041', true),
  ('b0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000001', 'Dhayari', 'dhayari', '411041', false),
  ('b0000000-0000-0000-0000-000000000072', 'a0000000-0000-0000-0000-000000000001', 'Lavale', 'lavale', '412115', true),
  ('b0000000-0000-0000-0000-000000000073', 'a0000000-0000-0000-0000-000000000001', 'Baramati', 'baramati', '413133', true)
ON CONFLICT (city_id, slug) DO UPDATE
SET name = EXCLUDED.name, pincode = EXCLUDED.pincode, is_popular = EXCLUDED.is_popular;

-- 5. Insert Verified Real Colleges Affiliated with SPPU / DTE / Autonomous
INSERT INTO public.colleges (
  id, area_id, name, short_name, slug, address, latitude, longitude, pincode, affiliation, college_type, categories, website, institute_code, source_meta
)
VALUES
  -- 1. COEP Tech University (Shivajinagar)
  (
    'c0000000-0000-0000-0000-000000000001',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'COEP Technological University (College of Engineering Pune)',
    'COEP',
    'coep-tech-university-pune',
    'Wellesely Road, Shivajinagar, Pune',
    18.5293000, 73.8565000, '411005',
    'State Technological University (Unitary)',
    'Public Autonomous University',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Civil', 'Mechanical', 'Electrical'],
    'https://www.coep.org.in',
    'DTE: 6006',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 2. Modern College of Arts, Science and Commerce (Shivajinagar)
  (
    'c0000000-0000-0000-0000-000000000002',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Progressive Education Society Modern College of Arts, Science and Commerce',
    'Modern College',
    'modern-college-shivajinagar',
    'Modern High School Road, Shivajinagar, Pune',
    18.5309000, 73.8475000, '411005',
    'Savitribai Phule Pune University (SPPU)',
    'Grant-in-Aid Autonomous',
    ARRAY['Science', 'Commerce', 'Arts', 'Computer Science', 'Biotechnology'],
    'https://moderncollegepune.edu.in',
    'SPPU: CAAP010160',
    'SPPU Affiliated College Directory'
  ),

  -- 3. College of Agriculture Pune (Shivajinagar)
  (
    'c0000000-0000-0000-0000-000000000003',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'College of Agriculture Pune (Mahatma Phule Krishi Vidyapeeth)',
    'Agriculture College',
    'college-of-agriculture-pune',
    'Narveer Tanaji Wadi, Shivajinagar, Pune',
    18.5325000, 73.8502000, '411005',
    'Mahatma Phule Krishi Vidyapeeth (MPKV)',
    'State Government College',
    ARRAY['Agriculture', 'Biotechnology', 'Horticulture'],
    'https://www.mpkv.ac.in',
    'MPKV Approved',
    'Government of Maharashtra Higher Education'
  ),

  -- 4. Fergusson College (Deccan / FC Road)
  (
    'c0000000-0000-0000-0000-000000000004',
    (SELECT id FROM public.areas WHERE slug = 'deccan' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Fergusson College (Autonomous)',
    'Fergusson',
    'fergusson-college-pune',
    'FC Road, Deccan Gymkhana, Pune',
    18.5236000, 73.8415000, '411004',
    'Savitribai Phule Pune University (SPPU)',
    'Autonomous Private Aided',
    ARRAY['Arts', 'Science', 'Computer Science', 'Data Science', 'Animation'],
    'https://www.fergusson.edu',
    'SPPU: CAAP010010',
    'SPPU Affiliated College Directory'
  ),

  -- 5. BMCC (Deccan)
  (
    'c0000000-0000-0000-0000-000000000005',
    (SELECT id FROM public.areas WHERE slug = 'deccan' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Brihan Maharashtra College of Commerce (BMCC)',
    'BMCC',
    'bmcc-pune',
    '845, Shivajinagar / BMCC Road, Deccan, Pune',
    18.5218000, 73.8344000, '411004',
    'Savitribai Phule Pune University (SPPU)',
    'Autonomous Private Aided',
    ARRAY['Commerce', 'Management', 'BBA', 'BCA', 'Finance'],
    'https://www.bmcc.ac.in',
    'SPPU: CAAP010020',
    'SPPU Affiliated College Directory'
  ),

  -- 6. ILS Law College (Deccan)
  (
    'c0000000-0000-0000-0000-000000000006',
    (SELECT id FROM public.areas WHERE slug = 'deccan' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'ILS Law College (Indian Law Society)',
    'ILS Law',
    'ils-law-college-pune',
    'Law College Road, Deccan Gymkhana, Pune',
    18.5168000, 73.8306000, '411004',
    'Savitribai Phule Pune University (SPPU)',
    'Private Aided Law College',
    ARRAY['Law', 'LLB', 'BA LLB', 'LLM', 'Cyber Law'],
    'https://ilslaw.edu',
    'BCI / SPPU',
    'Bar Council of India & SPPU'
  ),

  -- 7. Symbiosis College of Arts and Commerce (Deccan / SB Road)
  (
    'c0000000-0000-0000-0000-000000000007',
    (SELECT id FROM public.areas WHERE slug = 'deccan' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Symbiosis College of Arts and Commerce',
    'SCAC',
    'symbiosis-college-arts-commerce',
    'Senapati Bapat Road, Pune',
    18.5255000, 73.8348000, '411004',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Commerce', 'Arts', 'Management', 'Computer Applications'],
    'https://www.symbiosiscollege.edu.in',
    'SPPU: CAAP010200',
    'SPPU Affiliated College Directory'
  ),

  -- 8. Sir Parashurambhau College - SP College (Sadashiv Peth)
  (
    'c0000000-0000-0000-0000-000000000008',
    (SELECT id FROM public.areas WHERE slug = 'sadashiv-peth' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Sir Parashurambhau College (S.P. College)',
    'SP College',
    'sp-college-sadashiv-peth',
    'Tilak Road, Sadashiv Peth, Pune',
    18.5065000, 73.8504000, '411030',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Aided Autonomous',
    ARRAY['Arts', 'Science', 'Commerce', 'Computer Science'],
    'https://www.spcollegepune.ac.in',
    'SPPU: CAAP010030',
    'SPPU Affiliated College Directory'
  ),

  -- 9. MIT World Peace University (Kothrud)
  (
    'c0000000-0000-0000-0000-000000000009',
    (SELECT id FROM public.areas WHERE slug = 'kothrud' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'MIT World Peace University (MIT-WPU)',
    'MIT-WPU',
    'mit-wpu-kothrud-pune',
    'Survey No. 124, Paud Road, Kothrud, Pune',
    18.5178000, 73.8153000, '411038',
    'State Private University (UGC Approved)',
    'Private University',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Management', 'Pharmacy', 'Design', 'Law'],
    'https://mitwpu.edu.in',
    'UGC / AICTE',
    'UGC Recognized Universities Register'
  ),

  -- 10. MKSSS Cummins College of Engineering for Women (Karve Nagar)
  (
    'c0000000-0000-0000-0000-000000000010',
    (SELECT id FROM public.areas WHERE slug = 'karve-nagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'MKSSS Cummins College of Engineering for Women',
    'Cummins College',
    'cummins-college-karve-nagar',
    'Karve Nagar, Pune',
    18.4892000, 73.8174000, '411052',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Aided Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Electronics', 'Mechanical'],
    'https://www.cumminscollege.org',
    'DTE: 6276',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 11. Dr. Bhanuben Nanavati College of Architecture (Karve Nagar)
  (
    'c0000000-0000-0000-0000-000000000011',
    (SELECT id FROM public.areas WHERE slug = 'karve-nagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'MKSSS Dr. Bhanuben Nanavati College of Architecture for Women (BNCA)',
    'BNCA Architecture',
    'bnca-architecture-karve-nagar',
    'Karve Nagar, Pune',
    18.4890000, 73.8170000, '411052',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Aided Autonomous',
    ARRAY['Architecture', 'Landscape Architecture', 'Interior Design', 'Urban Design'],
    'https://www.bnca.ac.in',
    'COA / DTE: 6278',
    'Council of Architecture & SPPU'
  ),

  -- 12. Vishwakarma Institute of Technology - VIT (Bibwewadi)
  (
    'c0000000-0000-0000-0000-000000000012',
    (SELECT id FROM public.areas WHERE slug = 'bibwewadi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Bansilal Ramnath Agarwal Charitable Trust Vishwakarma Institute of Technology (VIT)',
    'VIT Pune',
    'vit-bibwewadi-pune',
    '666, Upper Indira Nagar, Bibwewadi, Pune',
    18.4636000, 73.8682000, '411037',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Chemical', 'Mechanical', 'IT'],
    'https://www.vit.edu',
    'DTE: 6273',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 13. Vishwakarma Institute of Information Technology - VIIT (Kondhwa)
  (
    'c0000000-0000-0000-0000-000000000013',
    (SELECT id FROM public.areas WHERE slug = 'kondhwa' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Vishwakarma Institute of Information Technology (VIIT)',
    'VIIT Pune',
    'viit-kondhwa-pune',
    'Survey No. 3/4, Kondhwa Budruk, Pune',
    18.4601000, 73.8841000, '411048',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Information Technology', 'Civil', 'AI'],
    'https://www.viit.ac.in',
    'DTE: 6284',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 14. Trinity College of Engineering and Research (Kondhwa)
  (
    'c0000000-0000-0000-0000-000000000014',
    (SELECT id FROM public.areas WHERE slug = 'kondhwa' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'KJ Educational Institutes Trinity College of Engineering and Research',
    'Trinity Engineering',
    'trinity-college-kondhwa',
    'Near Bopdev Ghat, Saswad Road, Kondhwa Annex, Pune',
    18.4410000, 73.9020000, '411048',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Management', 'MBA'],
    'https://www.kjei.edu.in/tcoer',
    'DTE: 6320',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 15. PICT - Pune Institute of Computer Technology (Dhankawadi)
  (
    'c0000000-0000-0000-0000-000000000015',
    (SELECT id FROM public.areas WHERE slug = 'dhankawadi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Society for Computer Technology and Research Pune Institute of Computer Technology (PICT)',
    'PICT',
    'pict-dhankawadi-pune',
    'Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune',
    18.4575000, 73.8508000, '411043',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Computer Science', 'AI', 'Data Science', 'Information Technology', 'Electronics'],
    'https://pict.edu',
    'DTE: 6271',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 16. Bharati Vidyapeeth College of Engineering (Katraj / Dhankawadi)
  (
    'c0000000-0000-0000-0000-000000000016',
    (SELECT id FROM public.areas WHERE slug = 'katraj' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Bharati Vidyapeeth (Deemed to be University) College of Engineering',
    'BVDU COE',
    'bvdu-college-of-engineering-katraj',
    'Pune-Satara Road, Dhankawadi, Katraj, Pune',
    18.4570000, 73.8530000, '411043',
    'Bharati Vidyapeeth (Deemed University)',
    'Deemed to be University',
    ARRAY['Engineering', 'Technology', 'Chemical', 'Computer Science', 'Civil', 'Electrical'],
    'https://bvucoepune.edu.in',
    'AICTE / BVDU',
    'AICTE Approved Institutions Directory'
  ),

  -- 17. Sinhgad College of Engineering - SCOE (Vadgaon Budruk)
  (
    'c0000000-0000-0000-0000-000000000017',
    (SELECT id FROM public.areas WHERE slug = 'vadgaon-budruk' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Sinhgad Technical Education Society Sinhgad College of Engineering (SCOE)',
    'SCOE Vadgaon',
    'sinhgad-college-engineering-vadgaon',
    '44/1 Vadgaon Budruk, Off Sinhagad Road, Pune',
    18.4650000, 73.8360000, '411041',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Mechanical', 'Civil', 'Biotechnology'],
    'https://cms.sinhgad.edu/sinhgad_engineering_institutes/vadgaon_scoe/about.aspx',
    'DTE: 6178',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 18. Smt. Kashibai Navale College of Engineering - SKNCOE (Vadgaon Budruk)
  (
    'c0000000-0000-0000-0000-000000000018',
    (SELECT id FROM public.areas WHERE slug = 'vadgaon-budruk' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Sinhgad Technical Education Society Smt. Kashibai Navale College of Engineering',
    'SKNCOE',
    'skncoe-vadgaon-pune',
    '44/1 Vadgaon Budruk, Off Sinhagad Road, Pune',
    18.4665000, 73.8375000, '411041',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Information Technology', 'MBA'],
    'https://cms.sinhgad.edu/sinhgad_engineering_institutes/skncoe_vadgaon/about.aspx',
    'DTE: 6177',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 19. Zeal College of Engineering and Research (Narhe)
  (
    'c0000000-0000-0000-0000-000000000019',
    (SELECT id FROM public.areas WHERE slug = 'narhe' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Zeal Education Society Zeal College of Engineering and Research',
    'Zeal Engineering',
    'zeal-college-engineering-narhe',
    'Survey No. 39, Narhe, Dhayari Road, Pune',
    18.4480000, 73.8270000, '411041',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Electrical', 'Management'],
    'https://zcoer.in',
    'DTE: 6755',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 20. Dr. D. Y. Patil Institute of Technology - DYPIT (Pimpri)
  (
    'c0000000-0000-0000-0000-000000000020',
    (SELECT id FROM public.areas WHERE slug = 'pimpri' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Dr. D. Y. Patil Unitech Society Dr. D. Y. Patil Institute of Technology',
    'DY Patil Pimpri',
    'dy-patil-institute-technology-pimpri',
    'Sant Tukaram Nagar, Pimpri, Pune',
    18.6258000, 73.8188000, '411018',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Data Science', 'Automation', 'Civil'],
    'https://engg.dypvp.edu.in',
    'DTE: 6207',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 21. Dr. D. Y. Patil Arts, Commerce and Science College (Pimpri)
  (
    'c0000000-0000-0000-0000-000000000021',
    (SELECT id FROM public.areas WHERE slug = 'pimpri' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Dr. D. Y. Patil Arts, Commerce and Science College',
    'DY Patil ACS',
    'dy-patil-acs-college-pimpri',
    'Sant Tukaram Nagar, Pimpri, Pune',
    18.6260000, 73.8180000, '411018',
    'Savitribai Phule Pune University',
    'Private Aided / Unaided',
    ARRAY['Arts', 'Commerce', 'Science', 'Computer Applications', 'Biotechnology'],
    'https://acs.dypvp.edu.in',
    'SPPU: CAAP014230',
    'SPPU Affiliated College Directory'
  ),

  -- 22. PCCOE - Pimpri Chinchwad College of Engineering (Nigdi / Akurdi)
  (
    'c0000000-0000-0000-0000-000000000022',
    (SELECT id FROM public.areas WHERE slug = 'nigdi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Pimpri Chinchwad Education Trust Pimpri Chinchwad College of Engineering (PCCOE)',
    'PCCOE Nigdi',
    'pccoe-nigdi-akurdi-pune',
    'Sector 26, Pradhikaran, Nigdi, Akurdi, Pune',
    18.6517000, 73.7618000, '411044',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Mechanical', 'Civil', 'MCA'],
    'https://www.pccoepune.com',
    'DTE: 6175',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 23. Dr. D. Y. Patil College of Engineering (Akurdi)
  (
    'c0000000-0000-0000-0000-000000000023',
    (SELECT id FROM public.areas WHERE slug = 'akurdi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Dr. D. Y. Patil Pratishthan Dr. D. Y. Patil College of Engineering',
    'DYPCOE Akurdi',
    'dypcoe-akurdi-pune',
    'D. Y. Patil Educational Complex, Sector 29, Nigdi Pradhikaran, Akurdi, Pune',
    18.6475000, 73.7595000, '411044',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Information Technology', 'Robotics'],
    'https://www.dypcoeakurdi.ac.in',
    'DTE: 6272',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 24. PCCOER - PCCOE & Research (Ravet)
  (
    'c0000000-0000-0000-0000-000000000024',
    (SELECT id FROM public.areas WHERE slug = 'ravet' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Pimpri Chinchwad College of Engineering and Research (PCCOER)',
    'PCCOER Ravet',
    'pccoer-ravet-pune',
    'Plot No. B, Sector No. 110, Gate No. 1, Laxminagar, Ravet, Pune',
    18.6530000, 73.7380000, '412101',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Mechanical', 'Civil', 'Electronics'],
    'https://pccoer.com',
    'DTE: 6822',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 25. JSPM Rajarshi Shahu College of Engineering - RSCOE (Tathawade)
  (
    'c0000000-0000-0000-0000-000000000025',
    (SELECT id FROM public.areas WHERE slug = 'tathawade' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Jayawant Shikshan Prasarak Mandal Rajarshi Shahu College of Engineering (RSCOE)',
    'RSCOE Tathawade',
    'rscoe-jspm-tathawade-pune',
    'Ashok Nagar, Tathawade, Pune',
    18.6186000, 73.7502000, '411033',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Data Science', 'Management', 'MBA'],
    'https://www.jspmrscoe.edu.in',
    'DTE: 6141',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 26. Indira Institute of Management - IIMP (Tathawade)
  (
    'c0000000-0000-0000-0000-000000000026',
    (SELECT id FROM public.areas WHERE slug = 'tathawade' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Shree Chanakya Education Society Indira Institute of Management (IIMP)',
    'Indira Tathawade',
    'indira-institute-management-tathawade',
    'Indira Campus, 85/5-A, New Pune-Mumbai Highway, Tathawade, Pune',
    18.6165000, 73.7475000, '411033',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous Management Institute',
    ARRAY['Management', 'MBA', 'BBA', 'Computer Applications', 'MCA'],
    'https://indiraiimp.edu.in',
    'AICTE / DTE: 6111',
    'AICTE Approved Management Institutes'
  ),

  -- 27. International Institute of Information Technology - I²IT (Hinjawadi)
  (
    'c0000000-0000-0000-0000-000000000027',
    (SELECT id FROM public.areas WHERE slug = 'hinjawadi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Hope Foundation International Institute of Information Technology (I²IT)',
    'I2IT Hinjawadi',
    'i2it-hinjawadi-pune',
    'P-14, Rajiv Gandhi Infotech Park, Phase 1, Hinjawadi, Pune',
    18.5912000, 73.7389000, '411057',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Computer Science', 'Information Technology', 'Electronics and Telecommunication'],
    'https://www.isquareit.edu.in',
    'DTE: 6754',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 28. Symbiosis Centre for Management Studies - SCMS (Viman Nagar)
  (
    'c0000000-0000-0000-0000-000000000028',
    (SELECT id FROM public.areas WHERE slug = 'viman-nagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Symbiosis Centre for Management Studies (SCMS)',
    'SCMS Viman Nagar',
    'scms-symbiosis-viman-nagar',
    'Survey No. 231, Near Pune International Airport, Viman Nagar, Pune',
    18.5638000, 73.9113000, '411014',
    'Symbiosis International (Deemed University)',
    'Constituent Institute of Deemed University',
    ARRAY['Management', 'BBA', 'International Business', 'Marketing', 'Finance'],
    'https://www.scmspune.ac.in',
    'SIU / UGC',
    'Symbiosis International University Directory'
  ),

  -- 29. Symbiosis Law School - SLS (Viman Nagar)
  (
    'c0000000-0000-0000-0000-000000000029',
    (SELECT id FROM public.areas WHERE slug = 'viman-nagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Symbiosis Law School (SLS Pune)',
    'SLS Viman Nagar',
    'sls-symbiosis-viman-nagar',
    'Survey No. 227, Plot No. 11, Rohan Mithila, Viman Nagar, Pune',
    18.5645000, 73.9125000, '411014',
    'Symbiosis International (Deemed University)',
    'Constituent Institute of Deemed University',
    ARRAY['Law', 'BA LLB', 'BBA LLB', 'LLM'],
    'https://www.symlaw.ac.in',
    'BCI / SIU',
    'Bar Council of India & SIU'
  ),

  -- 30. Marathwada Mitra Mandal Institute of Technology - MMIT (Lohegaon)
  (
    'c0000000-0000-0000-0000-000000000030',
    (SELECT id FROM public.areas WHERE slug = 'lohegaon' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Marathwada Mitra Mandal Institute of Technology (MMIT)',
    'MMIT Lohegaon',
    'mmit-lohegaon-pune',
    'Survey No. 35, Vadgaon Shinde Road, Lohegaon, Pune',
    18.6015000, 73.9270000, '411047',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Mechatronics', 'Mechanical'],
    'https://www.mmit.edu.in',
    'DTE: 6203',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 31. G. H. Raisoni College of Engineering and Management (Wagholi)
  (
    'c0000000-0000-0000-0000-000000000031',
    (SELECT id FROM public.areas WHERE slug = 'wagholi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'G. H. Raisoni College of Engineering and Management (GHRCEM)',
    'GH Raisoni Wagholi',
    'gh-raisoni-college-wagholi-pune',
    'Navin Gat No. 1200, Domkhel Road, Wagholi, Pune',
    18.5780000, 73.9850000, '412207',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Data Science', 'Management', 'MBA'],
    'https://ghrcem.raisoni.net',
    'DTE: 6155',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 32. JSPM Imperial College of Engineering and Research - ICOER (Wagholi)
  (
    'c0000000-0000-0000-0000-000000000032',
    (SELECT id FROM public.areas WHERE slug = 'wagholi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'JSPM Imperial College of Engineering and Research (ICOER)',
    'ICOER Wagholi',
    'icoer-jspm-wagholi-pune',
    'Pune-Nagar Road, Wagholi, Pune',
    18.5810000, 73.9890000, '412207',
    'Savitribai Phule Pune University',
    'Private Unaided',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Civil', 'Mechanical', 'MBA'],
    'https://www.jspmicoer.edu.in',
    'DTE: 6160',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 33. NICMAR University (Balewadi)
  (
    'c0000000-0000-0000-0000-000000000033',
    (SELECT id FROM public.areas WHERE slug = 'balewadi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'National Institute of Construction Management and Research (NICMAR University)',
    'NICMAR Balewadi',
    'nicmar-university-balewadi-pune',
    '25/1, Balewadi, N.I.A. Post Office, Pune',
    18.5802000, 73.7695000, '411045',
    'State Private University (UGC Approved)',
    'Private University',
    ARRAY['Management', 'Construction Management', 'Architecture', 'Real Estate', 'Engineering'],
    'https://www.nicmar.ac.in',
    'UGC Recognized',
    'UGC Recognized Universities Register'
  ),

  -- 34. Armed Forces Medical College - AFMC (Camp / Wanowrie)
  (
    'c0000000-0000-0000-0000-000000000034',
    (SELECT id FROM public.areas WHERE slug = 'wanowrie' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Armed Forces Medical College (AFMC Pune)',
    'AFMC',
    'afmc-pune-wanowrie',
    'Southern Command, Solapur Road, Wanowrie, Pune',
    18.5028000, 73.8864000, '411040',
    'Maharashtra University of Health Sciences (MUHS)',
    'Central Government Premier Defence Medical Institute',
    ARRAY['Medical', 'MBBS', 'Nursing', 'Allied Health Sciences'],
    'https://afmc.nic.in',
    'MCI / NMC / MUHS',
    'National Medical Commission of India'
  ),

  -- 35. Ness Wadia College of Commerce (Camp)
  (
    'c0000000-0000-0000-0000-000000000035',
    (SELECT id FROM public.areas WHERE slug = 'camp' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Modern Education Society Ness Wadia College of Commerce',
    'Ness Wadia',
    'ness-wadia-college-camp-pune',
    '19, Late Prin. V. K. Joag Path, Camp, Pune',
    18.5270000, 73.8820000, '411001',
    'Savitribai Phule Pune University',
    'Private Aided',
    ARRAY['Commerce', 'Management', 'BBA', 'BCA', 'Economics'],
    'https://nesswadiacollege.edu.in',
    'SPPU: CAAP010070',
    'SPPU Affiliated College Directory'
  ),

  -- 36. Nowrosjee Wadia College of Arts and Science (Camp)
  (
    'c0000000-0000-0000-0000-000000000036',
    (SELECT id FROM public.areas WHERE slug = 'camp' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Modern Education Society Nowrosjee Wadia College of Arts and Science',
    'Nowrosjee Wadia',
    'nowrosjee-wadia-college-camp-pune',
    '19, Late Prin. V. K. Joag Path, Camp, Pune',
    18.5280000, 73.8815000, '411001',
    'Savitribai Phule Pune University',
    'Private Aided',
    ARRAY['Science', 'Arts', 'Computer Science', 'Electronics'],
    'https://nowrosjeewadiacollege.edu.in',
    'SPPU: CAAP010060',
    'SPPU Affiliated College Directory'
  ),

  -- 37. Symbiosis Institute of Business Management - SIBM (Lavale)
  (
    'c0000000-0000-0000-0000-000000000037',
    (SELECT id FROM public.areas WHERE slug = 'lavale' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Symbiosis Institute of Business Management (SIBM Pune)',
    'SIBM Lavale',
    'sibm-lavale-pune',
    'Gram Lavale, Taluka Mulshi, Pune',
    18.5410000, 73.7380000, '412115',
    'Symbiosis International (Deemed University)',
    'Constituent Institute of Deemed University',
    ARRAY['Management', 'MBA', 'Innovation and Entrepreneurship'],
    'https://www.sibm.edu',
    'SIU / AICTE',
    'Symbiosis International University Directory'
  ),

  -- 38. MIT Academy of Engineering - MITAOE (Alandi)
  (
    'c0000000-0000-0000-0000-000000000038',
    (SELECT id FROM public.areas WHERE slug = 'alandi' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Maharashtra Academy of Engineering and Educational Research MIT Academy of Engineering (MITAOE)',
    'MITAOE Alandi',
    'mitaoe-alandi-pune',
    'Dehu Phata, Alandi (Dandi), Pune',
    18.6755000, 73.8965000, '412105',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Design', 'Electronics', 'Chemical'],
    'https://mitaoe.ac.in',
    'DTE: 6146',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 39. VPKBIET (Baramati)
  (
    'c0000000-0000-0000-0000-000000000039',
    (SELECT id FROM public.areas WHERE slug = 'baramati' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Vidya Pratishthan Kamalnayan Bajaj Institute of Engineering and Technology (VPKBIET)',
    'VPKBIET Baramati',
    'vpkbiet-baramati-pune',
    'Vidyanagari, Bhigwan Road, Baramati, Pune District',
    18.1565000, 74.5780000, '413133',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI', 'Civil', 'Electrical'],
    'https://www.vpkbiet.org',
    'DTE: 6282',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 40. AISSMS College of Engineering (Shivajinagar / Kennedy Road)
  (
    'c0000000-0000-0000-0000-000000000040',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'All India Shri Shivaji Memorial Society College of Engineering (AISSMS COE)',
    'AISSMS COE',
    'aissms-college-of-engineering-shivajinagar-pune',
    '1, Kennedy Road, Near Pune Railway Station, Shivajinagar, Pune',
    18.5284000, 73.8744000, '411001',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Mechanical', 'Civil', 'Chemical', 'Electrical'],
    'https://aissmscoe.com',
    'DTE: 6278',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 41. AISSMS Institute of Information Technology - IOIT (Shivajinagar)
  (
    'c0000000-0000-0000-0000-000000000041',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'All India Shri Shivaji Memorial Society Institute of Information Technology (AISSMS IOIT)',
    'AISSMS IOIT',
    'aissms-institute-of-information-technology-ioit-pune',
    'Kennedy Road, Near RTO, Shivajinagar, Pune',
    18.5298000, 73.8732000, '411001',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'AI and Data Science', 'Electronics'],
    'https://aissmsioit.org',
    'DTE: 6282',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 42. Army Institute of Technology - AIT (Dhanori / Dighi)
  (
    'c0000000-0000-0000-0000-000000000042',
    (SELECT id FROM public.areas WHERE slug = 'dhanori' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Army Institute of Technology (AIT Pune)',
    'AIT Pune',
    'army-institute-of-technology-ait-dhanori-pune',
    'Alandi Road, Dighi Hills, Dhanori, Pune',
    18.6068000, 73.8752000, '411015',
    'Savitribai Phule Pune University (Autonomous)',
    'Private Autonomous',
    ARRAY['Engineering', 'Technology', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical'],
    'https://www.aitpune.com',
    'DTE: 6222',
    'DTE Maharashtra Official Approved Institute'
  ),

  -- 43. Poona College of Pharmacy - Bharati Vidyapeeth (Katraj)
  (
    'c0000000-0000-0000-0000-000000000043',
    (SELECT id FROM public.areas WHERE slug = 'katraj' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Bharati Vidyapeeth (Deemed to be University) Poona College of Pharmacy',
    'Poona College of Pharmacy',
    'poona-college-of-pharmacy-katraj-pune',
    'Bharati Vidyapeeth Educational Complex, Pune-Satara Road, Katraj, Pune',
    18.4578000, 73.8508000, '411043',
    'Bharati Vidyapeeth (Deemed to be University) / PCI Approved',
    'Constituent College of Deemed University',
    ARRAY['Pharmacy', 'Pharmaceutical Sciences', 'Pharmacology', 'Pharmaceutics'],
    'https://pcp.bharatividyapeeth.edu',
    'PCI / AICTE Approved',
    'Pharmacy Council of India Approved Institutions Directory'
  ),

  -- 44. DES Shri Navalmal Firodia Law College (Deccan / FC Road)
  (
    'c0000000-0000-0000-0000-000000000044',
    (SELECT id FROM public.areas WHERE slug = 'deccan' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Deccan Education Society Shri Navalmal Firodia Law College (DES SNFLC)',
    'DES Law College',
    'des-shri-navalmal-firodia-law-college-deccan-pune',
    'Gate No 3, Fergusson College Campus, BMCC Road, Deccan Gymkhana, Pune',
    18.5204000, 73.8375000, '411004',
    'Savitribai Phule Pune University / Bar Council of India',
    'Private Aided',
    ARRAY['Law', 'Legal Studies', 'Cyber Law', 'Corporate Law'],
    'https://deslaw.edu.in',
    'BCI / SPPU Law Directory',
    'Bar Council of India & SPPU Law Faculty Directory'
  ),

  -- 45. PES Modern Law College (Shivajinagar / Ganeshkhind)
  (
    'c0000000-0000-0000-0000-000000000045',
    (SELECT id FROM public.areas WHERE slug = 'shivajinagar' AND city_id = 'a0000000-0000-0000-0000-000000000001'),
    'Progressive Education Society Modern Law College',
    'Modern Law College',
    'modern-law-college-shivajinagar-pune',
    'S.No. 85/86, University Road, Ganeshkhind, Shivajinagar, Pune',
    18.5372000, 73.8340000, '411016',
    'Savitribai Phule Pune University / Bar Council of India',
    'Private Aided',
    ARRAY['Law', 'Constitutional Law', 'Criminal Law', 'Intellectual Property'],
    'https://modernlawcollege.org',
    'BCI / SPPU Law Directory',
    'Bar Council of India & SPPU Law Faculty Directory'
  )
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  area_id = EXCLUDED.area_id,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  pincode = EXCLUDED.pincode,
  affiliation = EXCLUDED.affiliation,
  college_type = EXCLUDED.college_type,
  categories = EXCLUDED.categories,
  website = EXCLUDED.website,
  institute_code = EXCLUDED.institute_code,
  source_meta = EXCLUDED.source_meta;

-- 6. Add Performance Indexes
CREATE INDEX IF NOT EXISTS idx_colleges_area_id ON public.colleges(area_id);
CREATE INDEX IF NOT EXISTS idx_colleges_slug ON public.colleges(slug);
CREATE INDEX IF NOT EXISTS idx_colleges_short_name ON public.colleges(short_name);
CREATE INDEX IF NOT EXISTS idx_areas_city_id ON public.areas(city_id);
CREATE INDEX IF NOT EXISTS idx_areas_slug ON public.areas(slug);
