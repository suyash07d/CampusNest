// ==========================================================================
// CampusNest — Admin Intelligence & Control Center Service
// ==========================================================================
// Security Rules:
// 1. All functions verify current user role is 'admin' before executing.
// 2. Database RLS policies act as the ultimate security boundary.
// 3. Never returns or logs auth tokens, passwords, or session secrets.
// 4. Returns empty/zero states when data is absent; never fabricates dummy metrics.
// ==========================================================================

import { supabase } from './supabase.js';

/**
 * Internal Security Assertion: Verifies that the active caller is an authenticated admin.
 * @throws {Error} If unauthenticated or non-admin
 */
export async function assertAdmin() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Unauthorized: Valid session required to access Admin Service.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Administrative privileges required.');
  }

  return user;
}

/**
 * Retrieve all registered student profiles with their college affiliations,
 * favourite counts, enquiry counts, and recent activity.
 */
export async function getStudents({ limit = 50, offset = 0, query = '' } = {}) {
  await assertAdmin();

  try {
    let studentQuery = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        role,
        is_verified,
        created_at,
        updated_at,
        colleges:college_id (
          id,
          name,
          short_name,
          slug
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query && query.trim()) {
      const q = query.trim();
      studentQuery = studentQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: students, count, error } = await studentQuery;

    if (error) {
      console.warn('Error fetching student profiles:', error.message);
      return { students: [], totalCount: 0 };
    }

    if (!students || students.length === 0) {
      return { students: [], totalCount: 0 };
    }

    // Enrich students with their activity & engagement footprint
    const studentIds = students.map(s => s.id);

    // 1. Fetch enquiries count per student
    const { data: enquiries } = await supabase
      .from('enquiries')
      .select('student_id')
      .in('student_id', studentIds);

    // 2. Fetch favourites count per student
    const { data: favourites } = await supabase
      .from('favourites')
      .select('student_id')
      .in('student_id', studentIds);

    // 3. Fetch latest activity timestamp per student
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('actor_id, action, created_at')
      .in('actor_id', studentIds)
      .order('created_at', { ascending: false });

    const enriched = students.map(student => {
      const studentEnquiries = (enquiries || []).filter(e => e.student_id === student.id);
      const studentFavourites = (favourites || []).filter(f => f.student_id === student.id);
      const lastActivity = (recentLogs || []).find(l => l.actor_id === student.id);

      return {
        ...student,
        college: student.colleges || null,
        enquiriesCount: studentEnquiries.length,
        favouritesCount: studentFavourites.length,
        lastActiveAt: lastActivity ? lastActivity.created_at : student.updated_at || student.created_at,
        lastAction: lastActivity ? lastActivity.action : 'account_registered',
      };
    });

    return {
      students: enriched,
      totalCount: count || enriched.length,
    };
  } catch (err) {
    console.error('getStudents exception:', err);
    return { students: [], totalCount: 0 };
  }
}

/**
 * Retrieve comprehensive dossier for a single student including inquiries,
 * favourites, reviews, reports, and activity trail.
 * @param {string} studentId - UUID of student
 */
export async function getStudentById(studentId) {
  if (!studentId) return null;
  await assertAdmin();

  try {
    // 1. Student profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        role,
        is_verified,
        created_at,
        updated_at,
        colleges:college_id (
          id,
          name,
          short_name,
          slug,
          address
        )
      `)
      .eq('id', studentId)
      .maybeSingle();

    if (profileErr || !profile) {
      console.warn('Student profile not found:', profileErr?.message);
      return null;
    }

    // 2. Student's submitted enquiries
    const { data: enquiries } = await supabase
      .from('enquiries')
      .select(`
        id,
        room_type_preference,
        visit_date,
        message,
        status,
        created_at,
        updated_at,
        pg:pg_id (
          id,
          name,
          starting_monthly_rent,
          address
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // 3. Student's favourited PGs
    const { data: favourites } = await supabase
      .from('favourites')
      .select(`
        created_at,
        pg:pg_id (
          id,
          name,
          starting_monthly_rent,
          gender_type
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // 4. Student's reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        food_rating,
        wifi_rating,
        review_text,
        is_verified_tenant,
        created_at,
        pg:pg_id (
          id,
          name
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // 5. Student's reports
    const { data: reports } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        pg:pg_id (
          id,
          name
        )
      `)
      .eq('reporter_id', studentId)
      .order('created_at', { ascending: false });

    // 6. Recent activity logs
    const { data: activities } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('actor_id', studentId)
      .order('created_at', { ascending: false })
      .limit(30);

    return {
      profile: {
        ...profile,
        college: profile.colleges || null,
      },
      enquiries: enquiries || [],
      favourites: favourites || [],
      reviews: reviews || [],
      reports: reports || [],
      activities: activities || [],
    };
  } catch (err) {
    console.error('getStudentById exception:', err);
    return null;
  }
}

/**
 * Retrieve activity history for a specific student.
 */
export async function getStudentActivity(studentId, { limit = 50 } = {}) {
  if (!studentId) return [];
  await assertAdmin();

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('actor_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching student activity:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getStudentActivity caught error:', err);
    return [];
  }
}

/**
 * Calculate demand preferences and search footprint for a single student.
 */
export async function getStudentDemandSummary(studentId) {
  if (!studentId) return null;
  await assertAdmin();

  try {
    const activities = await getStudentActivity(studentId, { limit: 100 });

    if (!activities || activities.length === 0) {
      return {
        totalSearches: 0,
        totalViews: 0,
        totalEnquiries: 0,
        topAreas: [],
        topColleges: [],
        filterPreferences: {},
      };
    }

    const areaCount = {};
    const collegeCount = {};
    let searchCount = 0;
    let viewCount = 0;
    let enquiryCount = 0;
    const filterAgg = {
      girlsOnly: 0,
      boysOnly: 0,
      coed: 0,
      mealsIncluded: 0,
      walkingDistance: 0,
    };

    for (const log of activities) {
      const meta = log.metadata || {};

      if (log.action === 'pg_search' || log.action === 'area_selected') {
        const area = meta.area_name || meta.area_slug;
        if (area) {
          areaCount[area] = (areaCount[area] || 0) + 1;
        }
      }

      if (log.action === 'pg_search' || log.action === 'college_selected') {
        const col = meta.college_name || meta.college_slug;
        if (col) {
          collegeCount[col] = (collegeCount[col] || 0) + 1;
        }
      }

      if (log.action === 'pg_search') {
        searchCount++;
        if (meta.filters) {
          if (meta.filters.girlsOnly) filterAgg.girlsOnly++;
          if (meta.filters.boysOnly) filterAgg.boysOnly++;
          if (meta.filters.coed) filterAgg.coed++;
          if (meta.filters.mealsIncluded) filterAgg.mealsIncluded++;
          if (meta.filters.walkingDistance) filterAgg.walkingDistance++;
        }
      }

      if (log.action === 'pg_viewed') viewCount++;
      if (log.action === 'enquiry_created') enquiryCount++;
    }

    const sortObjectToRanked = (obj) =>
      Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
      totalSearches: searchCount,
      totalViews: viewCount,
      totalEnquiries: enquiryCount,
      topAreas: sortObjectToRanked(areaCount),
      topColleges: sortObjectToRanked(collegeCount),
      filterPreferences: filterAgg,
    };
  } catch (err) {
    console.error('getStudentDemandSummary caught error:', err);
    return null;
  }
}

/**
 * Retrieve recent platform activity logs with enriched actor identity.
 */
export async function getPlatformActivity({
  limit = 40,
  offset = 0,
  actorRole = null,
  action = null,
} = {}) {
  await assertAdmin();

  try {
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actorRole) {
      query = query.eq('actor_role', actorRole);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data: logs, count, error } = await query;

    if (error) {
      console.warn('Error fetching platform activity:', error.message);
      return { activities: [], totalCount: 0 };
    }

    if (!logs || logs.length === 0) {
      return { activities: [], totalCount: 0 };
    }

    // Enrich with actor profiles
    const actorIds = [...new Set(logs.map(l => l.actor_id).filter(Boolean))];
    let profilesMap = {};

    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url')
        .in('id', actorIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }
    }

    const enriched = logs.map(log => ({
      ...log,
      actor: log.actor_id ? (profilesMap[log.actor_id] || { full_name: 'Unknown User', email: '' }) : { full_name: 'Visitor', email: '' },
    }));

    return {
      activities: enriched,
      totalCount: count || enriched.length,
    };
  } catch (err) {
    console.error('getPlatformActivity caught error:', err);
    return { activities: [], totalCount: 0 };
  }
}

/**
 * Aggregated Search & Demand Analytics across all student activity.
 * Returns authentic counts calculated exclusively from real activity_logs data.
 */
export async function getSearchDemandSummary() {
  await assertAdmin();

  try {
    // Query recent search and selection activities
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('action, metadata, created_at')
      .in('action', ['pg_search', 'area_selected', 'college_selected', 'pg_viewed', 'pg_favourited'])
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !logs || logs.length === 0) {
      return {
        totalSearches: 0,
        mostSearchedAreas: [],
        mostSearchedColleges: [],
        mostViewedPGs: [],
        mostFavouritedPGs: [],
        filterTrends: {
          girlsOnly: 0,
          boysOnly: 0,
          coed: 0,
          mealsIncluded: 0,
          walkingDistance: 0,
        },
      };
    }

    const areaCount = {};
    const collegeCount = {};
    const pgViewCount = {};
    const pgFavCount = {};
    let searchTotal = 0;

    const filterTrends = {
      girlsOnly: 0,
      boysOnly: 0,
      coed: 0,
      mealsIncluded: 0,
      walkingDistance: 0,
    };

    for (const log of logs) {
      const meta = log.metadata || {};

      if (log.action === 'pg_search') {
        searchTotal++;
        if (meta.area_name || meta.area_slug) {
          const area = meta.area_name || meta.area_slug;
          areaCount[area] = (areaCount[area] || 0) + 1;
        }
        if (meta.college_name || meta.college_slug) {
          const col = meta.college_name || meta.college_slug;
          collegeCount[col] = (collegeCount[col] || 0) + 1;
        }
        if (meta.filters) {
          if (meta.filters.girlsOnly) filterTrends.girlsOnly++;
          if (meta.filters.boysOnly) filterTrends.boysOnly++;
          if (meta.filters.coed) filterTrends.coed++;
          if (meta.filters.mealsIncluded) filterTrends.mealsIncluded++;
          if (meta.filters.walkingDistance) filterTrends.walkingDistance++;
        }
      }

      if (log.action === 'area_selected') {
        const area = meta.area_name || meta.area_slug;
        if (area) areaCount[area] = (areaCount[area] || 0) + 1;
      }

      if (log.action === 'college_selected') {
        const col = meta.college_name || meta.college_slug;
        if (col) collegeCount[col] = (collegeCount[col] || 0) + 1;
      }

      if (log.action === 'pg_viewed') {
        const pg = meta.pg_name || log.target_id || 'PG Property';
        pgViewCount[pg] = (pgViewCount[pg] || 0) + 1;
      }

      if (log.action === 'pg_favourited') {
        const pg = meta.pg_name || log.target_id || 'PG Property';
        pgFavCount[pg] = (pgFavCount[pg] || 0) + 1;
      }
    }

    const sortToRanked = (obj, limit = 8) =>
      Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return {
      totalSearches: searchTotal,
      mostSearchedAreas: sortToRanked(areaCount),
      mostSearchedColleges: sortToRanked(collegeCount),
      mostViewedPGs: sortToRanked(pgViewCount),
      mostFavouritedPGs: sortToRanked(pgFavCount),
      filterTrends,
    };
  } catch (err) {
    console.error('getSearchDemandSummary caught error:', err);
    return {
      totalSearches: 0,
      mostSearchedAreas: [],
      mostSearchedColleges: [],
      mostViewedPGs: [],
      mostFavouritedPGs: [],
      filterTrends: {},
    };
  }
}

/**
 * Retrieve high-level operational counts across the entire CampusNest platform.
 * Returns authentic counts calculated from real database tables with zero fabricated figures.
 */
export async function getOverviewMetrics() {
  await assertAdmin();

  try {
    const [
      studentsRes,
      ownersRes,
      totalPGsRes,
      pendingPGsRes,
      approvedPGsRes,
      enquiriesRes,
      openReportsRes,
      activitiesRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'owner'),
      supabase.from('pg_listings').select('id', { count: 'exact', head: true }),
      supabase.from('pg_listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('pg_listings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'investigating']),
      supabase.from('activity_logs').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalStudents: studentsRes.count || 0,
      totalOwners: ownersRes.count || 0,
      totalPGs: totalPGsRes.count || 0,
      pendingPGs: pendingPGsRes.count || 0,
      approvedPGs: approvedPGsRes.count || 0,
      totalEnquiries: enquiriesRes.count || 0,
      openReports: openReportsRes.count || 0,
      totalActivityLogs: activitiesRes.count || 0,
    };
  } catch (err) {
    console.error('getOverviewMetrics exception:', err);
    return {
      totalStudents: 0,
      totalOwners: 0,
      totalPGs: 0,
      pendingPGs: 0,
      approvedPGs: 0,
      totalEnquiries: 0,
      openReports: 0,
      totalActivityLogs: 0,
    };
  }
}

/**
 * Retrieve registered PG property owners with listing metrics.
 */
export async function getOwners({ limit = 50, offset = 0, query = '' } = {}) {
  await assertAdmin();

  try {
    let ownerQuery = supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, role, is_verified, created_at, updated_at', { count: 'exact' })
      .eq('role', 'owner')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query && query.trim()) {
      const q = query.trim();
      ownerQuery = ownerQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: owners, count, error } = await ownerQuery;

    if (error || !owners || owners.length === 0) {
      return { owners: [], totalCount: 0 };
    }

    const ownerIds = owners.map(o => o.id);

    // Fetch listing counts per owner
    const { data: listings } = await supabase
      .from('pg_listings')
      .select('id, owner_id, status')
      .in('owner_id', ownerIds);

    const enriched = owners.map(owner => {
      const ownerListings = (listings || []).filter(l => l.owner_id === owner.id);
      return {
        ...owner,
        totalListings: ownerListings.length,
        approvedListings: ownerListings.filter(l => l.status === 'approved').length,
        pendingListings: ownerListings.filter(l => l.status === 'pending').length,
        rejectedListings: ownerListings.filter(l => l.status === 'rejected' || l.status === 'suspended').length,
      };
    });

    return {
      owners: enriched,
      totalCount: count || enriched.length,
    };
  } catch (err) {
    console.error('getOwners exception:', err);
    return { owners: [], totalCount: 0 };
  }
}

/**
 * Retrieve comprehensive owner profile with their PG properties and associated enquiries.
 */
export async function getOwnerById(ownerId) {
  if (!ownerId) return null;
  await assertAdmin();

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ownerId)
      .maybeSingle();

    if (error || !profile) return null;

    // Fetch owner's PG listings with areas
    const { data: listings } = await supabase
      .from('pg_listings')
      .select(`
        id,
        name,
        slug,
        address,
        gender_type,
        starting_monthly_rent,
        status,
        created_at,
        updated_at,
        area:area_id (id, name, slug),
        rooms (id, room_type, monthly_rent, available_beds, total_beds)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    // Fetch enquiries for all owned PGs
    const listingIds = (listings || []).map(l => l.id);
    let enquiries = [];

    if (listingIds.length > 0) {
      const { data: enqData } = await supabase
        .from('enquiries')
        .select(`
          id,
          room_type_preference,
          visit_date,
          message,
          status,
          created_at,
          pg:pg_id (id, name),
          student:student_id (id, full_name, email, phone)
        `)
        .in('pg_id', listingIds)
        .order('created_at', { ascending: false });

      enquiries = enqData || [];
    }

    return {
      profile,
      listings: listings || [],
      enquiries,
    };
  } catch (err) {
    console.error('getOwnerById exception:', err);
    return null;
  }
}

/**
 * Retrieve PG listings for admin moderation and queue management.
 */
export async function getPGListings({
  status = 'all',
  limit = 50,
  offset = 0,
  query = '',
} = {}) {
  await assertAdmin();

  try {
    let pgQuery = supabase
      .from('pg_listings')
      .select(`
        id,
        name,
        slug,
        address,
        description,
        gender_type,
        starting_monthly_rent,
        security_deposit,
        notice_period_days,
        food_available,
        food_type,
        status,
        curfew_time,
        created_at,
        updated_at,
        owner:owner_id (
          id,
          full_name,
          email,
          phone,
          is_verified
        ),
        area:area_id (
          id,
          name,
          slug
        ),
        rooms (
          id,
          room_type,
          monthly_rent,
          available_beds,
          total_beds
        ),
        pg_colleges (
          id,
          distance_meters,
          walking_time_mins,
          is_primary,
          college:college_id (
            id,
            name,
            short_name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      pgQuery = pgQuery.eq('status', status);
    }

    if (query && query.trim()) {
      const q = query.trim();
      pgQuery = pgQuery.or(`name.ilike.%${q}%,address.ilike.%${q}%`);
    }

    const { data: listings, count, error } = await pgQuery;

    if (error) {
      console.warn('Error fetching PG listings:', error.message);
      return { listings: [], totalCount: 0 };
    }

    return {
      listings: listings || [],
      totalCount: count || (listings || []).length,
    };
  } catch (err) {
    console.error('getPGListings exception:', err);
    return { listings: [], totalCount: 0 };
  }
}

/**
 * Retrieve single PG listing complete details for in-depth moderation inspection.
 */
export async function getPGListingById(pgId) {
  if (!pgId) return null;
  await assertAdmin();

  try {
    const { data: pg, error } = await supabase
      .from('pg_listings')
      .select(`
        *,
        owner:owner_id (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          is_verified
        ),
        area:area_id (
          id,
          name,
          slug
        ),
        rooms (*),
        pg_photos (*),
        pg_amenities (
          id,
          amenity:amenity_id (
            id,
            name,
            category,
            icon_key
          )
        ),
        pg_colleges (
          id,
          distance_meters,
          walking_time_mins,
          is_primary,
          college:college_id (
            id,
            name,
            short_name,
            address
          )
        ),
        enquiries (
          id,
          room_type_preference,
          visit_date,
          message,
          status,
          created_at,
          student:student_id (id, full_name, email, phone)
        ),
        reviews (
          id,
          rating,
          review_text,
          created_at,
          student:student_id (full_name)
        )
      `)
      .eq('id', pgId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching PG listing by ID:', error.message);
      return null;
    }

    return pg;
  } catch (err) {
    console.error('getPGListingById exception:', err);
    return null;
  }
}

/**
 * Moderate a PG listing (Approve, Reject, Suspend) with mandatory admin_actions audit record.
 */
export async function moderatePGListing({
  pgId,
  newStatus,
  notes = '',
  adminId,
}) {
  if (!pgId || !['approved', 'rejected', 'suspended', 'pending'].includes(newStatus)) {
    throw new Error('Invalid PG ID or status.');
  }
  const user = await assertAdmin();
  const effectiveAdminId = adminId || user.id;

  // 1. Update the PG listing status
  const { data: updatedPG, error: updateErr } = await supabase
    .from('pg_listings')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pgId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to update PG status: ${updateErr.message}`);
  }

  // 2. Insert into admin_actions (Audit Trail)
  await supabase.from('admin_actions').insert({
    admin_id: effectiveAdminId,
    action: `pg_${newStatus}`,
    target_type: 'pg_listing',
    target_id: pgId,
    notes: notes || `PG listing status updated to ${newStatus}`,
  });

  // 3. Insert into activity_logs
  await supabase.from('activity_logs').insert({
    actor_id: effectiveAdminId,
    actor_role: 'admin',
    action: `pg_${newStatus}`,
    target_type: 'pg_listing',
    target_id: pgId,
    metadata: {
      pg_name: updatedPG.name,
      new_status: newStatus,
      notes: notes || null,
    },
  });

  return updatedPG;
}

/**
 * Retrieve all enquiries with student and PG metadata.
 */
export async function getEnquiries({
  status = 'all',
  limit = 50,
  offset = 0,
} = {}) {
  await assertAdmin();

  try {
    let enqQuery = supabase
      .from('enquiries')
      .select(`
        id,
        room_type_preference,
        visit_date,
        message,
        status,
        created_at,
        updated_at,
        student:student_id (
          id,
          full_name,
          email,
          phone
        ),
        pg:pg_id (
          id,
          name,
          address,
          starting_monthly_rent,
          owner:owner_id (
            id,
            full_name,
            phone
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      enqQuery = enqQuery.eq('status', status);
    }

    const { data: enquiries, count, error } = await enqQuery;

    if (error) {
      console.warn('Error fetching enquiries:', error.message);
      return { enquiries: [], totalCount: 0 };
    }

    return {
      enquiries: enquiries || [],
      totalCount: count || (enquiries || []).length,
    };
  } catch (err) {
    console.error('getEnquiries exception:', err);
    return { enquiries: [], totalCount: 0 };
  }
}

/**
 * Update enquiry status with audit logging.
 */
export async function updateEnquiryStatus({
  enquiryId,
  status,
  notes = '',
  adminId,
}) {
  if (!enquiryId || !['pending', 'contacted', 'visit_scheduled', 'closed'].includes(status)) {
    throw new Error('Invalid enquiry status.');
  }
  const user = await assertAdmin();
  const effectiveAdminId = adminId || user.id;

  const { data, error } = await supabase
    .from('enquiries')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enquiryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update enquiry status: ${error.message}`);
  }

  await supabase.from('admin_actions').insert({
    admin_id: effectiveAdminId,
    action: `enquiry_${status}`,
    target_type: 'enquiry',
    target_id: enquiryId,
    notes: notes || `Enquiry status changed to ${status}`,
  });

  return data;
}

/**
 * Retrieve user reports filed against listings with reporter and PG metadata.
 */
export async function getReports({
  status = 'all',
  limit = 50,
  offset = 0,
} = {}) {
  await assertAdmin();

  try {
    let repQuery = supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        updated_at,
        reporter:reporter_id (
          id,
          full_name,
          email,
          phone
        ),
        pg:pg_id (
          id,
          name,
          address,
          owner:owner_id (
            id,
            full_name,
            phone
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      repQuery = repQuery.eq('status', status);
    }

    const { data: reports, count, error } = await repQuery;

    if (error) {
      console.warn('Error fetching reports:', error.message);
      return { reports: [], totalCount: 0 };
    }

    return {
      reports: reports || [],
      totalCount: count || (reports || []).length,
    };
  } catch (err) {
    console.error('getReports exception:', err);
    return { reports: [], totalCount: 0 };
  }
}

/**
 * Moderate report (Investigating, Resolved, Dismissed) with admin action logging.
 */
export async function moderateReport({
  reportId,
  status,
  notes = '',
  adminId,
}) {
  if (!reportId || !['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    throw new Error('Invalid report status.');
  }
  const user = await assertAdmin();
  const effectiveAdminId = adminId || user.id;

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update report status: ${error.message}`);
  }

  await supabase.from('admin_actions').insert({
    admin_id: effectiveAdminId,
    action: `report_${status}`,
    target_type: 'report',
    target_id: reportId,
    notes: notes || `Report status updated to ${status}`,
  });

  await supabase.from('activity_logs').insert({
    actor_id: effectiveAdminId,
    actor_role: 'admin',
    action: `report_${status}`,
    target_type: 'report',
    target_id: reportId,
    metadata: { new_status: status, notes },
  });

  return data;
}

/**
 * Update student/user verification flag (permitted by Migration 005 security trigger).
 */
export async function updateStudentVerification({
  studentId,
  isVerified,
  notes = '',
  adminId,
}) {
  if (!studentId || typeof isVerified !== 'boolean') {
    throw new Error('Invalid verification parameters.');
  }
  const user = await assertAdmin();
  const effectiveAdminId = adminId || user.id;

  // Migration 005 trigger allows updating only is_verified
  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_verified: isVerified,
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user verification: ${error.message}`);
  }

  await supabase.from('admin_actions').insert({
    admin_id: effectiveAdminId,
    action: isVerified ? 'user_verified' : 'user_unverified',
    target_type: 'profile',
    target_id: studentId,
    notes: notes || `User verification set to ${isVerified}`,
  });

  await supabase.from('activity_logs').insert({
    actor_id: effectiveAdminId,
    actor_role: 'admin',
    action: isVerified ? 'user_verified' : 'user_unverified',
    target_type: 'profile',
    target_id: studentId,
    metadata: { is_verified: isVerified, notes },
  });

  return data;
}

/**
 * Retrieve admin actions audit history.
 */
export async function getAdminActionsAudit({ limit = 50, offset = 0 } = {}) {
  await assertAdmin();

  try {
    const { data: actions, count, error } = await supabase
      .from('admin_actions')
      .select(`
        id,
        action,
        target_type,
        target_id,
        notes,
        created_at,
        admin:admin_id (
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('Error fetching admin actions:', error.message);
      return { actions: [], totalCount: 0 };
    }

    return {
      actions: actions || [],
      totalCount: count || (actions || []).length,
    };
  } catch (err) {
    console.error('getAdminActionsAudit exception:', err);
    return { actions: [], totalCount: 0 };
  }
}

