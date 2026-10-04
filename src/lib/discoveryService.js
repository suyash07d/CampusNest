// ==========================================================================
// CampusNest — Discovery Service (Supabase + Verified Pune Dataset)
// ==========================================================================

import { supabase } from './supabase.js';
import { PUNE_CITY, PUNE_AREAS, PUNE_COLLEGES } from '../data/puneDiscoveryData.js';

/**
 * Fetch Pune City Record
 */
export async function getPuneCity() {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('slug', 'pune')
      .maybeSingle();

    if (!error && data) {
      return {
        ...PUNE_CITY,
        ...data,
      };
    }
  } catch (err) {
    console.warn('Supabase city query fallback:', err.message);
  }
  return PUNE_CITY;
}

/**
 * Fetch Pune Localities / Areas
 */
export async function getPuneAreas() {
  try {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(area => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        pincode: area.pincode,
        popular: area.is_popular,
        tagline: PUNE_AREAS.find(a => a.slug === area.slug)?.tagline || `Pune • PIN: ${area.pincode || '411xxx'}`,
      }));
    }
  } catch (err) {
    console.warn('Supabase areas query fallback:', err.message);
  }
  return PUNE_AREAS;
}

/**
 * Search and Filter Colleges
 * @param {Object} options
 * @param {string} options.areaSlug - Specific area slug, or 'all' for All Pune Colleges
 * @param {string} options.query - Partial name / abbreviation / alias
 * @param {string} options.category - Academic course / domain filter
 */
export async function searchColleges({ areaSlug = 'all', query = '', category = 'All', limit = 50 } = {}) {
  const cleanQuery = (query || '').trim().toLowerCase();

  // Try querying Supabase
  try {
    let sbQuery = supabase
      .from('colleges')
      .select(`
        id,
        name,
        short_name,
        slug,
        address,
        latitude,
        longitude,
        pincode,
        affiliation,
        college_type,
        categories,
        website,
        institute_code,
        source_meta,
        areas:area_id (id, name, slug, pincode)
      `)
      .limit(limit);

    if (cleanQuery) {
      sbQuery = sbQuery.or(`name.ilike.%${cleanQuery}%,short_name.ilike.%${cleanQuery}%,slug.ilike.%${cleanQuery}%`);
    }

    const { data, error } = await sbQuery;

    if (!error && data && data.length > 0) {
      let results = data.map(item => ({
        id: item.id,
        areaSlug: item.areas?.slug || '',
        areaName: item.areas?.name || '',
        name: item.name,
        shortName: item.short_name || '',
        slug: item.slug,
        address: item.address,
        pincode: item.pincode || item.areas?.pincode,
        latitude: item.latitude,
        longitude: item.longitude,
        affiliation: item.affiliation || 'Savitribai Phule Pune University (SPPU)',
        collegeType: item.college_type || 'Recognized Institute',
        categories: item.categories || ['Higher Education'],
        website: item.website,
        instituteCode: item.institute_code,
        sourceMeta: item.source_meta || 'SPPU / DTE Maharashtra Directory',
      }));

      // Filter by areaSlug if not 'all'
      if (areaSlug && areaSlug !== 'all') {
        results = results.filter(c => c.areaSlug === areaSlug);
      }

      // Filter by category if not 'All'
      if (category && category !== 'All') {
        results = results.filter(c => 
          c.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
        );
      }

      return {
        colleges: results,
        totalCount: results.length,
        isUsingDatabase: true,
      };
    }
  } catch (err) {
    console.warn('Supabase colleges query fallback:', err.message);
  }

  // Resilient fallback using verified Pune Dataset
  let results = [...PUNE_COLLEGES];

  // 1. Strict Area Filtering (Requirement: If Kothrud is selected, do NOT show colleges from Hadapsar)
  if (areaSlug && areaSlug !== 'all') {
    results = results.filter(c => c.areaSlug === areaSlug);
  }

  // 2. Smart Search Filtering (abbreviations, aliases, partial names)
  if (cleanQuery) {
    results = results.filter(c => {
      const matchName = c.name.toLowerCase().includes(cleanQuery);
      const matchShort = c.shortName.toLowerCase().includes(cleanQuery);
      const matchSlug = c.slug.toLowerCase().includes(cleanQuery);
      const matchAliases = c.aliases?.some(alias => alias.toLowerCase().includes(cleanQuery));
      const matchCode = c.instituteCode?.toLowerCase().includes(cleanQuery);
      const matchCategories = c.categories?.some(cat => cat.toLowerCase().includes(cleanQuery));
      return matchName || matchShort || matchSlug || matchAliases || matchCode || matchCategories;
    });
  }

  // 3. Category Filter
  if (category && category !== 'All') {
    results = results.filter(c => 
      c.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
    );
  }

  // Decorate with Area Names
  const decorated = results.map(c => {
    const area = PUNE_AREAS.find(a => a.slug === c.areaSlug);
    return {
      ...c,
      areaName: area?.name || c.areaSlug,
    };
  });

  return {
    colleges: decorated.slice(0, limit),
    totalCount: decorated.length,
    isUsingDatabase: false,
  };
}
