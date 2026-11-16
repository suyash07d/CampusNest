import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PREVIEW_PGS } from '../data/mockData';
import { getLiveApprovedPGs } from '../lib/ownerService';
import { PUNE_COLLEGES, PUNE_AREAS } from '../data/puneDiscoveryData';
import { 
  IconMapPin, 
  IconBuilding, 
  IconShield, 
  IconCheck, 
  IconExternalLink, 
  IconBell, 
  IconSearch, 
  IconSparkles,
  IconArrowRight,
  IconStar,
  IconWifi,
  IconUtensils,
  IconChevronDown,
  IconHeart
} from './Icons';
import './DiscoveryPreview.css';

// Popular Pune Campuses for 1-click filter
const POPULAR_CAMPUSES = [
  { id: 'all', label: 'All Pune Campuses' },
  { id: 'coep', label: 'Near COEP Tech', matchKeyword: 'COEP' },
  { id: 'mit', label: 'Near MIT-WPU', matchKeyword: 'MIT' },
  { id: 'dypatil', label: 'Near DY Patil & PCCOE', matchKeyword: 'DY Patil' },
  { id: 'symbiosis', label: 'Near Symbiosis', matchKeyword: 'Symbiosis' },
];

export default function DiscoveryPreview({ 
  searchParams, 
  activeFilters = {}, 
  onSelectCollege, 
  onSelectPG,
  onOpenOwnerModal 
}) {
  const [selectedGender, setSelectedGender] = useState('all'); // 'all' | 'girls' | 'boys' | 'coed'
  const [selectedCampusFilter, setSelectedCampusFilter] = useState('all');
  const [onlySaved, setOnlySaved] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);
  const [savedPGIds, setSavedPGIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aplastay_saved_pgs');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [isCollegeDrawerOpen, setIsCollegeDrawerOpen] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isWaitlistSuccess, setIsWaitlistSuccess] = useState(false);
  const [livePGs, setLivePGs] = useState([]);

  // Fetch Live Cloud PGs from Supabase
  useEffect(() => {
    let isMounted = true;
    getLiveApprovedPGs().then(listings => {
      if (isMounted && listings && listings.length > 0) {
        setLivePGs(listings);
      }
    });

    const handlePGUpdate = () => {
      getLiveApprovedPGs().then(listings => {
        if (isMounted && listings && listings.length > 0) {
          setLivePGs(listings);
        }
      });
    };
    window.addEventListener('aplastay:pg_updated', handlePGUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('aplastay:pg_updated', handlePGUpdate);
    };
  }, []);

  // Merge Live Supabase Listings with verified preview fallback
  const allAvailablePGs = useMemo(() => {
    if (livePGs.length === 0) return PREVIEW_PGS;
    const liveIds = new Set(livePGs.map(p => p.id));
    return [...livePGs, ...PREVIEW_PGS.filter(p => !liveIds.has(p.id))];
  }, [livePGs]);

  const handleToggleSave = (e, pg) => {
    e.stopPropagation();
    setSavedPGIds(prev => {
      const isCurrentlySaved = prev.includes(pg.id);
      const updated = isCurrentlySaved 
        ? prev.filter(id => id !== pg.id)
        : [...prev, pg.id];
      
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aplastay_saved_pgs', JSON.stringify(updated));
          const existingObjs = JSON.parse(localStorage.getItem('aplastay_saved_pg_objects') || '[]');
          const updatedObjs = isCurrentlySaved
            ? existingObjs.filter(item => (item.id || item.pg?.id) !== pg.id)
            : [pg, ...existingObjs.filter(item => (item.id || item.pg?.id) !== pg.id)];
          localStorage.setItem('aplastay_saved_pg_objects', JSON.stringify(updatedObjs));
          window.dispatchEvent(new CustomEvent('aplastay:saved_changed', { detail: updated }));
        } catch (err) { /* ignore */ }
      }

      setToastNotice(isCurrentlySaved ? `Removed ${pg.name} from Shortlist` : `Saved ${pg.name} to Shortlist ❤️`);
      setTimeout(() => setToastNotice(null), 2500);

      return updated;
    });
  };

  // Active college from parent searchParams if any
  const activeCollege = useMemo(() => {
    if (searchParams?.collegeObj) return searchParams.collegeObj;
    if (searchParams?.college) {
      const match = PUNE_COLLEGES.find(c => c.slug === searchParams.college || c.id === searchParams.college);
      if (match) return match;
    }
    return null;
  }, [searchParams]);

  // Filtered PG Listings
  const filteredPGs = useMemo(() => {
    return allAvailablePGs.filter(pg => {
      // 0. Shortlist Wishlist Filter
      if (onlySaved && !savedPGIds.includes(pg.id)) return false;

      // 1. Gender Filter
      if (selectedGender === 'girls' && pg.genderBadge !== 'girls') return false;
      if (selectedGender === 'boys' && pg.genderBadge !== 'boys') return false;
      if (selectedGender === 'coed' && pg.genderBadge !== 'coed') return false;

      // 2. Props Active Filters (from Navbar / Hero search)
      if (activeFilters.girlsOnly && pg.genderBadge !== 'girls') return false;
      if (activeFilters.boysOnly && pg.genderBadge !== 'boys') return false;
      if (activeFilters.coed && pg.genderBadge !== 'coed') return false;
      if (activeFilters.walkingDistance) {
        const meters = parseInt(pg.distance) || 999;
        if (meters > 400) return false;
      }
      if (activeFilters.mealsIncluded) {
        const hasMeal = pg.tags?.some(t => t.toLowerCase().includes('meal')) ||
                        pg.amenities?.some(a => a.name.toLowerCase().includes('meal'));
        if (!hasMeal) return false;
      }

      // 3. College Shortcut Filter
      if (selectedCampusFilter !== 'all') {
        const campus = POPULAR_CAMPUSES.find(c => c.id === selectedCampusFilter);
        if (campus && campus.matchKeyword) {
          const matchTarget = pg.targetCollege.toLowerCase().includes(campus.matchKeyword.toLowerCase());
          if (!matchTarget) return false;
        }
      }

      // 4. Parent SearchParams College Filter
      if (activeCollege) {
        const searchWord = (activeCollege.shortName || activeCollege.name).toLowerCase();
        const matchesCollege = pg.targetCollege.toLowerCase().includes(searchWord) ||
                               pg.area.toLowerCase().includes((activeCollege.areaName || '').toLowerCase());
        // If there's an exact match, prefer it; otherwise show all if none match
        if (matchesCollege) return true;
      }

      return true;
    });
  }, [allAvailablePGs, selectedGender, selectedCampusFilter, activeFilters, activeCollege, onlySaved, savedPGIds]);

  // Filtered 45 Colleges for drawer
  const filteredColleges = useMemo(() => {
    const q = collegeSearchQuery.trim().toLowerCase();
    if (!q) return PUNE_COLLEGES.slice(0, 12); // Show top 12 initially in drawer
    return PUNE_COLLEGES.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.areaName.toLowerCase().includes(q) ||
      (c.pincode && c.pincode.includes(q))
    );
  }, [collegeSearchQuery]);

  const handlePickCollege = (college) => {
    if (onSelectCollege) {
      onSelectCollege(college);
    }
    // Match quick campus shortcut if available
    if (college.shortName.includes('COEP')) setSelectedCampusFilter('coep');
    else if (college.shortName.includes('MIT')) setSelectedCampusFilter('mit');
    else if (college.shortName.includes('DY Patil')) setSelectedCampusFilter('dypatil');
    else if (college.shortName.includes('Symbiosis')) setSelectedCampusFilter('symbiosis');
    else setSelectedCampusFilter('all');

    // Scroll to the verified PGs
    const el = document.getElementById('discovery');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (studentEmail) setIsWaitlistSuccess(true);
  };

  return (
    <section id="discovery" className="discovery-section" aria-label="Pune Campus PG Discovery Hub">
      <div className="container">
        
        {/* Section Header */}
        <div className="discovery-header-compact">
          <div className="discovery-titles">
            <div className="discovery-badge-pill">
              <IconSparkles className="w-3.5 h-3.5 text-indigo" />
              <span>VERIFIED PUNE STUDENT HOUSING • ZERO BROKERAGE</span>
            </div>
            <h2 className="discovery-main-title">
              Verified Student PGs &amp; Hostels
            </h2>
            <p className="discovery-subtitle">
              Inspect honest walking distances to college gates, check transparent multi-tier sharing pricing (Single, Double, Triple), and connect with hosts directly.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="discovery-metrics-pill">
            <div className="metric-item">
              <span className="metric-number">100%</span>
              <span className="metric-label">Zero Brokerage</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">&lt; 500m</span>
              <span className="metric-label">Average Walk</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">₹6.5k</span>
              <span className="metric-label">Starting Rent</span>
            </div>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="pg-filter-toolbar">
          {/* Gender Filter Pills */}
          <div className="gender-filter-group" role="tablist" aria-label="Filter by gender">
            <button
              type="button"
              className={`filter-chip ${selectedGender === 'all' ? 'chip-active' : ''}`}
              onClick={() => setSelectedGender('all')}
            >
              All PGs ({PREVIEW_PGS.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedGender === 'girls' ? 'chip-active chip-girls' : ''}`}
              onClick={() => setSelectedGender('girls')}
            >
              👩 Girls Only
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedGender === 'boys' ? 'chip-active chip-boys' : ''}`}
              onClick={() => setSelectedGender('boys')}
            >
              👨 Boys Only
            </button>
            <button
              type="button"
              className={`filter-chip ${selectedGender === 'coed' ? 'chip-active chip-coed' : ''}`}
              onClick={() => setSelectedGender('coed')}
            >
              🏢 Co-living
            </button>
            <button
              type="button"
              className={`filter-chip chip-shortlist-pill ${onlySaved ? 'chip-active chip-saved' : ''}`}
              onClick={() => setOnlySaved(!onlySaved)}
              title="Show only bookmarked PGs"
            >
              ❤️ Shortlist {savedPGIds.length > 0 ? `(${savedPGIds.length})` : ''}
            </button>
          </div>

          {/* Popular Campus Filter Pills */}
          <div className="campus-filter-group">
            {POPULAR_CAMPUSES.map(c => (
              <button
                key={c.id}
                type="button"
                className={`campus-chip ${selectedCampusFilter === c.id ? 'campus-chip-active' : ''}`}
                onClick={() => setSelectedCampusFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Campus Anchor Banner (If a college was searched) */}
        {activeCollege && (
          <div className="active-anchor-banner">
            <div className="anchor-banner-left">
              <span className="live-radar-dot" />
              <span>Anchored to <strong>{activeCollege.name}</strong> ({activeCollege.areaName}, Pune)</span>
            </div>
            <button 
              type="button" 
              className="btn-clear-anchor"
              onClick={() => {
                if (onSelectCollege) onSelectCollege(null);
                setSelectedCampusFilter('all');
              }}
            >
              ✕ Clear Filter
            </button>
          </div>
        )}

        {/* The Verified PG Cards Grid */}
        <div className="pg-cards-grid">
          {filteredPGs.map((pg) => {
            const isGirls = pg.genderBadge === 'girls';
            const isBoys = pg.genderBadge === 'boys';
            
            return (
              <motion.article 
                key={pg.id}
                className="pg-showcase-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35 }}
                onClick={() => onSelectPG && onSelectPG(pg)}
              >
                {/* Media Image Container */}
                <div className="pg-card-media">
                  <img 
                    src={pg.heroImage} 
                    alt={pg.name} 
                    className="pg-cover-img" 
                    loading="lazy"
                  />
                  <div className="pg-media-overlay" />

                  {/* Top Floating Badges */}
                  <div className="pg-top-badges">
                    <div className="pg-top-left-badges">
                      <span className={`pg-gender-badge ${isGirls ? 'badge-girls' : isBoys ? 'badge-boys' : 'badge-coed'}`}>
                        {pg.gender}
                      </span>
                      <span className="pg-zero-fee-badge">
                        0% Brokerage
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`btn-card-heart ${savedPGIds.includes(pg.id) ? 'heart-active' : ''}`}
                      onClick={(e) => handleToggleSave(e, pg)}
                      aria-label={savedPGIds.includes(pg.id) ? 'Remove from Shortlist' : 'Save to Shortlist'}
                      title={savedPGIds.includes(pg.id) ? 'Saved' : 'Save to Shortlist'}
                    >
                      <IconHeart className={`w-4 h-4 ${savedPGIds.includes(pg.id) ? 'fill-current text-pink' : ''}`} />
                    </button>
                  </div>

                  {/* Distance from Campus Tag */}
                  <div className="pg-distance-pill">
                    <IconMapPin className="w-3.5 h-3.5 text-emerald" />
                    <span><strong>{pg.distance}</strong> ({pg.walkingTime}) to {pg.targetCollege.split(' ')[0]}</span>
                  </div>
                </div>

                {/* PG Card Body */}
                <div className="pg-card-body">
                  <div className="pg-header-row">
                    <div>
                      <h3 className="pg-card-title">{pg.name}</h3>
                      <p className="pg-card-location">{pg.area}</p>
                    </div>
                    <div className="pg-rating-badge">
                      <IconStar className="w-3.5 h-3.5 text-amber fill-current" />
                      <span>{pg.rating}</span>
                    </div>
                  </div>

                  {/* Room Sharing Options */}
                  <div className="pg-sharing-row">
                    <span className="sharing-label">Rooms:</span>
                    <div className="sharing-tags-list">
                      {pg.sharingTypes.map(st => (
                        <span key={st} className="sharing-tag">{st}</span>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Highlights */}
                  <div className="pg-amenities-row">
                    {pg.amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="amenity-chip">
                        {a.name.includes('Wi-Fi') ? <IconWifi className="w-3 h-3 text-cyan" /> :
                         a.name.includes('Meal') || a.name.includes('Food') ? <IconUtensils className="w-3 h-3 text-amber" /> :
                         <IconCheck className="w-3 h-3 text-emerald" />}
                        <span>{a.name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Card Bottom: Rent & Action */}
                  <div className="pg-card-footer">
                    <div className="pg-price-stack">
                      <span className="price-caption">Starting Rent</span>
                      <div className="price-amount-row">
                        <span className="price-val">₹{pg.rent}</span>
                        <span className="price-unit">/month</span>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn-view-pg"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectPG) onSelectPG(pg);
                      }}
                    >
                      <span>View Details</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Fallback if no PGs match filter */}
        {filteredPGs.length === 0 && (
          <div className="pg-empty-filter-state">
            {onlySaved ? (
              <div className="empty-shortlist-prompt">
                <span className="empty-shortlist-heart">❤️</span>
                <h4>Your Shortlist is Empty</h4>
                <p>Click the heart icon on any accommodation card to add it to your shortlist for quick comparison.</p>
                <button 
                  type="button" 
                  className="btn-reset-filters"
                  onClick={() => setOnlySaved(false)}
                >
                  Browse All PGs
                </button>
              </div>
            ) : (
              <>
                <p>No accommodations found matching this specific filter.</p>
                <button 
                  type="button" 
                  className="btn-reset-filters"
                  onClick={() => {
                    setSelectedGender('all');
                    setSelectedCampusFilter('all');
                    setOnlySaved(false);
                    if (onSelectCollege) onSelectCollege(null);
                  }}
                >
                  Reset Filters to View All PGs
                </button>
              </>
            )}
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastNotice && (
          <div className="toast-save-notice" role="status">
            <span>{toastNotice}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* COMPACT CAMPUS DIRECTORY DRAWER (Non-intrusive)                  */}
        {/* ================================================================= */}
        <div className="compact-campus-explorer">
          <div className="explorer-card">
            <div className="explorer-header">
              <div className="explorer-text">
                <span className="explorer-pill">45+ PUNE INSTITUTIONS</span>
                <h3 className="explorer-title">Need accommodation near a specific university or college?</h3>
                <p className="explorer-desc">Search your college gate anchor to check pedestrian walk times and verified PG availability.</p>
              </div>

              <div className="explorer-actions">
                <div className="explorer-search-box">
                  <IconSearch className="w-4 h-4 text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search college, COEP, MIT, PIN..." 
                    value={collegeSearchQuery}
                    onChange={(e) => {
                      setCollegeSearchQuery(e.target.value);
                      if (!isCollegeDrawerOpen) setIsCollegeDrawerOpen(true);
                    }}
                    className="explorer-search-input"
                  />
                </div>

                <button 
                  type="button"
                  className="btn-toggle-colleges"
                  onClick={() => setIsCollegeDrawerOpen(!isCollegeDrawerOpen)}
                >
                  <span>{isCollegeDrawerOpen ? 'Hide Campuses ▲' : 'Browse All 45 Campuses ▼'}</span>
                </button>
              </div>
            </div>

            {/* Expandable College Grid (Only shown when opened or searched) */}
            <AnimatePresence>
              {isCollegeDrawerOpen && (
                <motion.div 
                  className="explorer-colleges-drawer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="drawer-colleges-grid">
                    {filteredColleges.map((college) => {
                      const isPicked = activeCollege?.slug === college.slug;
                      return (
                        <div 
                          key={college.slug} 
                          className={`drawer-college-card ${isPicked ? 'card-picked' : ''}`}
                          onClick={() => handlePickCollege(college)}
                        >
                          <div className="drawer-college-top">
                            <span className="drawer-acronym">{college.shortName}</span>
                            <span className="drawer-area">📍 {college.areaName}</span>
                          </div>
                          <strong className="drawer-college-name">{college.name}</strong>
                          <div className="drawer-college-foot">
                            <span className="drawer-affil">{college.affiliation}</span>
                            <span className="drawer-action-text">{isPicked ? '✓ Active' : 'Filter PGs →'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </section>
  );
}
