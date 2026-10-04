import { useState, useId, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconMapPin, 
  IconGraduationCap, 
  IconSearch, 
  IconArrowRight, 
  IconShield, 
  IconCheck, 
  IconChevronDown, 
  IconBuilding, 
  IconRotateCcw, 
  IconSpinner, 
  IconInfo, 
  IconSparkles,
  IconExternalLink,
  IconBell,
  IconFilter
} from './Icons';
import { PUNE_CITY, PUNE_AREAS, PUNE_COLLEGES } from '../data/puneDiscoveryData';
import { getPuneAreas, searchColleges } from '../lib/discoveryService';
import './Hero.css';

// Academic Category Options for quick filtering
const CATEGORY_OPTIONS = [
  'All Streams',
  'Engineering & Tech',
  'Management',
  'Arts & Science',
  'Commerce',
  'Law',
  'Pharmacy',
  'Architecture',
  'Medical'
];

// Scalable city definition: Pune is the sole active launch city
const EXPANSION_CITIES = [
  { id: 'pune', name: 'Pune', state: 'Maharashtra', isLaunch: true, status: 'Active Launch City', count: '39+ Colleges • 73 Localities' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', isLaunch: false, status: 'Expansion Phase 2', count: 'Coming Soon' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', isLaunch: false, status: 'Expansion Phase 2', count: 'Coming Soon' },
  { id: 'nashik', name: 'Nashik', state: 'Maharashtra', isLaunch: false, status: 'Expansion Phase 2', count: 'Coming Soon' },
  { id: 'csn', name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', isLaunch: false, status: 'Expansion Phase 2', count: 'Coming Soon' },
];

// Highlighted Pune college presets for 1-click discovery
const POPULAR_PUNE_PRESETS = [
  { name: 'COEP Tech', areaName: 'Shivajinagar', areaSlug: 'shivajinagar', slug: 'coep-technological-university-shivajinagar-pune' },
  { name: 'MIT-WPU', areaName: 'Kothrud', areaSlug: 'kothrud', slug: 'mit-wpu-kothrud-pune' },
  { name: 'PICT', areaName: 'Dhankawadi', areaSlug: 'dhankawadi', slug: 'pict-pune-institute-of-computer-technology-dhankawadi-pune' },
  { name: 'DY Patil Tech', areaName: 'Pimpri', areaSlug: 'pimpri', slug: 'dr-d-y-patil-institute-of-technology-pimpri-pune' },
  { name: 'Fergusson College', areaName: 'Deccan', areaSlug: 'deccan', slug: 'fergusson-college-deccan-pune' },
  { name: 'Symbiosis (SCMS/SLS)', areaName: 'Viman Nagar', areaSlug: 'viman-nagar', slug: 'symbiosis-centre-for-management-studies-scms-viman-nagar-pune' },
  { name: 'PCCOE', areaName: 'Nigdi', areaSlug: 'nigdi', slug: 'pccoe-pimpri-chinchwad-college-of-engineering-nigdi-pune' },
  { name: 'Cummins College', areaName: 'Karve Nagar', areaSlug: 'karve-nagar', slug: 'mksss-cummins-college-of-engineering-for-women-karve-nagar-pune' },
];

export default function Hero({ onSearchSubmit, onOpenOwnerModal }) {
  const citySelectId = useId();
  const areaSelectId = useId();
  const collegeSelectId = useId();

  // Primary Selection States
  const [selectedAreaSlug, setSelectedAreaSlug] = useState('all'); // 'all' or specific slug e.g. 'kothrud'
  const [selectedCollege, setSelectedCollege] = useState(null); // Selected college object

  // Dataset states
  const [areasList, setAreasList] = useState(PUNE_AREAS);
  const [collegesList, setCollegesList] = useState(PUNE_COLLEGES);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  // UI & Search States
  const [activeDropdown, setActiveDropdown] = useState(null); // 'city' | 'area' | 'college' | null
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const [collegeSearchInput, setCollegeSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Streams');
  const [isNotified, setIsNotified] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const searchPanelRef = useRef(null);

  // Initial load: Fetch areas from discovery service
  useEffect(() => {
    let isMounted = true;
    getPuneAreas().then(areas => {
      if (isMounted && areas && areas.length > 0) {
        setAreasList(areas);
      }
    }).catch(err => {
      console.warn('Could not load areas from service:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Sync colleges when area, query, or category changes
  useEffect(() => {
    let isMounted = true;
    const categoryParam = selectedCategory === 'All Streams' ? 'All' : selectedCategory;

    searchColleges({
      areaSlug: selectedAreaSlug,
      query: collegeSearchInput,
      category: categoryParam,
      limit: 60,
    }).then(res => {
      if (isMounted) {
        setCollegesList(res.colleges || []);
        setIsLoadingColleges(false);
      }
    }).catch(err => {
      console.warn('Error querying colleges:', err);
      if (isMounted) {
        setIsLoadingColleges(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedAreaSlug, collegeSearchInput, selectedCategory]);

  // Click outside to close active dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered Areas based on user typing
  const filteredAreas = useMemo(() => {
    const q = areaSearchInput.trim().toLowerCase();
    if (!q) return areasList;
    return areasList.filter(a => 
      a.name.toLowerCase().includes(q) ||
      (a.pincode && a.pincode.includes(q)) ||
      (a.tagline && a.tagline.toLowerCase().includes(q))
    );
  }, [areasList, areaSearchInput]);

  // Current Area Object
  const currentAreaObj = useMemo(() => {
    if (selectedAreaSlug === 'all') {
      return { name: 'All Pune Localities', slug: 'all', tagline: 'Browsing all 73 Pune areas (39+ Colleges)' };
    }
    return areasList.find(a => a.slug === selectedAreaSlug) || { name: 'Pune Locality', slug: selectedAreaSlug };
  }, [areasList, selectedAreaSlug]);

  // Handle Area Selection (Strict Area Isolation)
  const handleSelectArea = (areaSlug) => {
    setSelectedAreaSlug(areaSlug);
    setActiveDropdown(null);
    setAreaSearchInput('');

    // If current selected college is not in this new area, reset it
    if (selectedCollege && areaSlug !== 'all' && selectedCollege.areaSlug !== areaSlug) {
      setSelectedCollege(null);
      setIsNotified(false);
    }
  };

  // Handle College Selection
  const handleSelectCollege = (college) => {
    setSelectedCollege(college);
    // Automatically match the area to the college's verified area
    if (college.areaSlug && selectedAreaSlug !== college.areaSlug) {
      setSelectedAreaSlug(college.areaSlug);
    }
    setActiveDropdown(null);
    setIsNotified(false);

    if (onSearchSubmit) {
      onSearchSubmit({
        city: 'pune',
        area: college.areaSlug,
        areaName: college.areaName,
        college: college.slug,
        collegeObj: college,
      });
    }
  };

  // Handle Preset Quick Click
  const handlePresetClick = (preset) => {
    setSelectedAreaSlug(preset.areaSlug);
    const matched = PUNE_COLLEGES.find(c => c.slug === preset.slug);
    if (matched) {
      setSelectedCollege(matched);
      if (onSearchSubmit) {
        onSearchSubmit({
          city: 'pune',
          area: matched.areaSlug,
          areaName: matched.areaName,
          college: matched.slug,
          collegeObj: matched,
        });
      }
    }
    setIsNotified(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedAreaSlug('all');
    setSelectedCollege(null);
    setCollegeSearchInput('');
    setAreaSearchInput('');
    setSelectedCategory('All Streams');
    setActiveDropdown(null);
    setIsNotified(false);
  };

  // Handle Search Submission (Scroll to transition section)
  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit({
        city: 'pune',
        area: selectedAreaSlug,
        areaName: currentAreaObj.name,
        college: selectedCollege ? selectedCollege.slug : null,
        collegeObj: selectedCollege,
      });
    }
    const el = document.getElementById('discovery');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Student Waitlist Notification
  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (studentEmail || !showEmailInput) {
      setIsNotified(true);
      setShowEmailInput(false);
    } else {
      setShowEmailInput(true);
    }
  };

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="hero-top" className="hero-section">
      {/* Ambient background decoration */}
      <div className="hero-ambient-glow glow-top-left" aria-hidden="true" />
      <div className="hero-ambient-glow glow-bottom-right" aria-hidden="true" />
      <div className="hero-grid-pattern" aria-hidden="true" />

      <div className="container hero-container">
        <motion.div 
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pune Launch Badge */}
          <motion.div variants={fadeUp} className="hero-badge-container">
            <div className="hero-badge hero-badge-pune">
              <span className="badge-live-dot" />
              <span className="badge-pune-tag">PUNE LAUNCH EDITION</span>
              <span className="badge-sub">73 Localities • 39+ SPPU & DTE Verified Campuses</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={fadeUp} className="hero-title">
            Find verified student housing near your college in{' '}
            <span className="hero-title-accent">Pune.</span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p variants={fadeUp} className="hero-subtitle">
            Zero fake listings. Zero broker fee surprises. We are mapping gate-to-door walking distances,
            verified rooms, and home-cooked mess facilities exclusively around Pune&apos;s premier higher education institutes.
          </motion.p>

          {/* MAIN PUNE DISCOVERY COMMAND PANEL */}
          <motion.div variants={fadeUp} className="hero-search-wrapper" ref={searchPanelRef}>
            <div className="search-panel-container">
              {/* Header Bar */}
              <div className="search-panel-header">
                <div className="search-step-indicator">
                  <span className="step-tag">PUNE CAMPUS DISCOVERY ENGINE</span>
                  <span className="step-tag-sub">
                    {selectedCollege ? (
                      <span className="active-college-indicator">
                        📍 Anchor: <strong>{selectedCollege.shortName}</strong> ({selectedCollege.areaName})
                      </span>
                    ) : (
                      <span>Select your Pune locality &amp; college anchor</span>
                    )}
                  </span>
                </div>
                <div className="search-header-right">
                  <button 
                    type="button" 
                    className="btn-reset-filters" 
                    onClick={handleResetFilters}
                    title="Reset search and filters"
                  >
                    <IconRotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <div className="zero-brokerage-pill">
                    <IconShield className="pill-icon" />
                    <span>SPPU &amp; DTE Verified Data</span>
                  </div>
                </div>
              </div>

              {/* 3-Step Selection Grid */}
              <form onSubmit={handleSubmitSearch} className="search-form-grid">
                
                {/* 1. City Input Field (Pune Prominent) */}
                <div className="search-field-col">
                  <label htmlFor={citySelectId} className="field-label">
                    <IconMapPin className="label-icon" />
                    <span>01 / City (Launch)</span>
                  </label>
                  <div className="custom-select-wrapper">
                    <button
                      id={citySelectId}
                      type="button"
                      className={`custom-select-trigger ${activeDropdown === 'city' ? 'is-active' : ''}`}
                      onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')}
                      aria-haspopup="listbox"
                      aria-expanded={activeDropdown === 'city'}
                    >
                      <div className="trigger-content">
                        <div className="trigger-value-row">
                          <span className="trigger-value">Pune</span>
                          <span className="launch-city-tag">Active</span>
                        </div>
                        <span className="trigger-caption">Maharashtra (Launch City)</span>
                      </div>
                      <IconChevronDown className={`trigger-chevron ${activeDropdown === 'city' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'city' && (
                        <motion.div 
                          className="custom-dropdown-menu"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="dropdown-heading">Launch Focus City</div>
                          <div className="city-selection-active-item">
                            <div className="city-active-header">
                              <div>
                                <span className="city-name-big">Pune</span>
                                <span className="city-state-big">Maharashtra</span>
                              </div>
                              <span className="active-hub-badge">✓ Active Hub</span>
                            </div>
                            <p className="city-description">
                              {PUNE_CITY.tagline}. Currently indexing 73 urban localities and 39+ verified higher education institutions.
                            </p>
                          </div>

                          <div className="dropdown-heading dropdown-heading-muted">Upcoming Maharashtra Expansions</div>
                          <div className="upcoming-cities-list">
                            {EXPANSION_CITIES.filter(c => !c.isLaunch).map(c => (
                              <div key={c.id} className="upcoming-city-row">
                                <span className="upcoming-city-name">{c.name}</span>
                                <span className="upcoming-city-badge">Phase 2</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 2. Area / Locality Selector (73 Pune Areas + All) */}
                <div className="search-field-col">
                  <label htmlFor={areaSelectId} className="field-label">
                    <IconBuilding className="label-icon" />
                    <span>02 / Pune Locality</span>
                  </label>
                  <div className="custom-select-wrapper">
                    <button
                      id={areaSelectId}
                      type="button"
                      className={`custom-select-trigger ${activeDropdown === 'area' ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveDropdown(activeDropdown === 'area' ? null : 'area');
                        setAreaSearchInput('');
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={activeDropdown === 'area'}
                    >
                      <div className="trigger-content">
                        <span className="trigger-value">{currentAreaObj.name}</span>
                        <span className="trigger-caption">
                          {selectedAreaSlug === 'all' 
                            ? 'All 73 Localities (39+ Campuses)' 
                            : currentAreaObj.pincode 
                              ? `PIN: ${currentAreaObj.pincode}` 
                              : 'Pune Locality'}
                        </span>
                      </div>
                      <IconChevronDown className={`trigger-chevron ${activeDropdown === 'area' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'area' && (
                        <motion.div 
                          className="custom-dropdown-menu custom-dropdown-areas"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="dropdown-search-wrap">
                            <IconSearch className="w-3.5 h-3.5 dropdown-search-icon" />
                            <input 
                              type="text"
                              className="dropdown-search-input"
                              placeholder="Search 73 Pune areas or PIN..."
                              value={areaSearchInput}
                              onChange={(e) => setAreaSearchInput(e.target.value)}
                              autoFocus
                            />
                          </div>

                          <div className="dropdown-scroll-box">
                            {/* "All Pune" option */}
                            <button
                              type="button"
                              className={`dropdown-option ${selectedAreaSlug === 'all' ? 'is-selected' : ''}`}
                              onClick={() => handleSelectArea('all')}
                            >
                              <div className="option-info">
                                <span className="option-title">🌟 All Pune Localities</span>
                                <span className="option-desc">Search all 39+ verified colleges across Pune</span>
                              </div>
                              {selectedAreaSlug === 'all' && <IconCheck className="option-check" />}
                            </button>

                            <div className="dropdown-heading">Pune &amp; PCMC Localities ({filteredAreas.length})</div>

                            {filteredAreas.length === 0 ? (
                              <div className="dropdown-empty-state">
                                <IconInfo className="w-4 h-4" />
                                <span>No Pune area matching &quot;{areaSearchInput}&quot;</span>
                              </div>
                            ) : (
                              filteredAreas.map(area => (
                                <button
                                  key={area.slug}
                                  type="button"
                                  className={`dropdown-option ${selectedAreaSlug === area.slug ? 'is-selected' : ''}`}
                                  onClick={() => handleSelectArea(area.slug)}
                                >
                                  <div className="option-info">
                                    <div className="option-title-row">
                                      <span className="option-title">{area.name}</span>
                                      {area.pincode && <span className="pincode-pill">{area.pincode}</span>}
                                    </div>
                                    <span className="option-desc">{area.tagline}</span>
                                  </div>
                                  {selectedAreaSlug === area.slug && <IconCheck className="option-check" />}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 3. College Selector (Strict Area Isolation) */}
                <div className="search-field-col search-field-college">
                  <label htmlFor={collegeSelectId} className="field-label">
                    <IconGraduationCap className="label-icon" />
                    <span>03 / Verified College</span>
                  </label>
                  <div className="custom-select-wrapper">
                    <button
                      id={collegeSelectId}
                      type="button"
                      className={`custom-select-trigger ${activeDropdown === 'college' ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveDropdown(activeDropdown === 'college' ? null : 'college');
                        setCollegeSearchInput('');
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={activeDropdown === 'college'}
                    >
                      <div className="trigger-content">
                        <span className="trigger-value trigger-college-name">
                          {selectedCollege ? selectedCollege.shortName || selectedCollege.name : 'Choose or search college...'}
                        </span>
                        <span className="trigger-caption">
                          {selectedCollege 
                            ? `${selectedCollege.areaName} • ${selectedCollege.affiliation.split('(')[0]}`
                            : selectedAreaSlug === 'all' 
                              ? '39+ Official SPPU & DTE Campuses' 
                              : `Colleges in ${currentAreaObj.name}`}
                        </span>
                      </div>
                      <IconChevronDown className={`trigger-chevron ${activeDropdown === 'college' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'college' && (
                        <motion.div 
                          className="custom-dropdown-menu custom-dropdown-colleges"
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="dropdown-search-wrap">
                            <IconSearch className="w-3.5 h-3.5 dropdown-search-icon" />
                            <input 
                              type="text"
                              className="dropdown-search-input"
                              placeholder="Search by name, acronym (e.g. COEP, MIT, PICT, DY Patil)..."
                              value={collegeSearchInput}
                              onChange={(e) => setCollegeSearchInput(e.target.value)}
                              autoFocus
                            />
                          </div>

                          <div className="dropdown-heading-flex">
                            <span>
                              {selectedAreaSlug === 'all' 
                                ? `All Pune Colleges (${collegesList.length})` 
                                : `Colleges in ${currentAreaObj.name} (${collegesList.length})`}
                            </span>
                            {selectedAreaSlug !== 'all' && (
                              <button 
                                type="button" 
                                className="show-all-btn"
                                onClick={() => handleSelectArea('all')}
                              >
                                View All Pune Campuses
                              </button>
                            )}
                          </div>

                          <div className="dropdown-scroll-box">
                            {isLoadingColleges ? (
                              <div className="dropdown-loading-state">
                                <IconSpinner className="w-5 h-5 text-indigo animate-spin" />
                                <span>Filtering verified campuses...</span>
                              </div>
                            ) : collegesList.length === 0 ? (
                              <div className="dropdown-empty-state">
                                <IconInfo className="w-5 h-5" />
                                <div>
                                  <p className="empty-title">No college found in {currentAreaObj.name}</p>
                                  <p className="empty-sub">
                                    Try switching to &quot;All Pune Localities&quot; or search by common abbreviation like COEP, MIT, or PICT.
                                  </p>
                                  <button
                                    type="button"
                                    className="empty-action-btn"
                                    onClick={() => handleSelectArea('all')}
                                  >
                                    Search Across All Pune
                                  </button>
                                </div>
                              </div>
                            ) : (
                              collegesList.map(college => (
                                <button
                                  key={college.slug}
                                  type="button"
                                  className={`dropdown-college-item ${selectedCollege?.slug === college.slug ? 'is-selected' : ''}`}
                                  onClick={() => handleSelectCollege(college)}
                                >
                                  <div className="college-item-main">
                                    <div className="college-header-line">
                                      <span className="college-short-badge">{college.shortName}</span>
                                      <span className="college-area-badge">📍 {college.areaName}</span>
                                    </div>
                                    <span className="college-full-name">{college.name}</span>
                                    <div className="college-meta-line">
                                      <span className="college-affil">{college.affiliation}</span>
                                      {college.instituteCode && (
                                        <span className="college-code-pill">{college.instituteCode}</span>
                                      )}
                                    </div>
                                  </div>
                                  {selectedCollege?.slug === college.slug && (
                                    <IconCheck className="option-check text-indigo" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Search Action CTA */}
                <div className="search-action-col">
                  <button type="submit" className="search-submit-btn">
                    <IconSearch className="btn-search-icon" />
                    <span>Explore Campus</span>
                    <IconArrowRight className="btn-arrow-icon" />
                  </button>
                </div>
              </form>

              {/* Stream / Category Filter Tabs */}
              <div className="search-preferences-bar">
                <div className="stream-filter-label">
                  <IconFilter className="w-3.5 h-3.5 text-indigo" />
                  <span>Filter by stream:</span>
                </div>
                <div className="pref-chips-list">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button 
                      key={cat}
                      type="button" 
                      className={`pref-chip ${selectedCategory === cat ? 'chip-active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular College Shortcuts */}
              <div className="quick-presets-row">
                <span className="presets-label">Popular Pune Campuses:</span>
                <div className="presets-tags">
                  {POPULAR_PUNE_PRESETS.map(preset => (
                    <button
                      key={preset.slug}
                      type="button"
                      className={`preset-btn ${selectedCollege?.slug === preset.slug ? 'preset-active' : ''}`}
                      onClick={() => handlePresetClick(preset)}
                    >
                      📍 {preset.name} ({preset.areaName})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* REQUIREMENT 6: POLISHED TRANSITION STATE AFTER COLLEGE SELECTION  */}
          {/* ================================================================= */}
          <AnimatePresence mode="wait">
            {selectedCollege ? (
              <motion.div 
                key={selectedCollege.slug}
                className="transition-stage-wrapper"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="transition-card">
                  {/* Top Status Header */}
                  <div className="transition-card-header">
                    <div className="radar-status-badge">
                      <span className="radar-pulse-dot" />
                      <span className="radar-text">PUNE DISCOVERY RADAR ACTIVE</span>
                      <span className="radar-tag">2026 Batch Mapping</span>
                    </div>

                    <div className="transition-header-right">
                      {selectedCollege.website && (
                        <a 
                          href={selectedCollege.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-external-link"
                          title="Open official institute website"
                        >
                          <span>Official Portal</span>
                          <IconExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn-clear-selection"
                        onClick={() => setSelectedCollege(null)}
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  {/* Main Notice Heading */}
                  <div className="transition-content-hero">
                    <div className="transition-headline-group">
                      <span className="transition-subhead">Campus Anchor Established</span>
                      <h2 className="transition-main-title">
                        PG discovery for this college is coming next
                      </h2>
                      <p className="transition-lead">
                        CampusNest field auditors are currently verifying student accommodations, hostels, and 
                        home-cooked mess providers within walking radius of <strong>{selectedCollege.shortName}&apos;s</strong> gates.
                      </p>
                    </div>
                  </div>

                  {/* Verified Details Grid */}
                  <div className="transition-details-grid">
                    <div className="detail-box">
                      <span className="detail-label">City</span>
                      <span className="detail-value highlight-city">Pune (Launch City)</span>
                      <span className="detail-sub">Maharashtra Educational Capital</span>
                    </div>

                    <div className="detail-box">
                      <span className="detail-label">Locality / Area</span>
                      <span className="detail-value">
                        {selectedCollege.areaName}
                      </span>
                      <span className="detail-sub">
                        {selectedCollege.pincode ? `PIN Code: ${selectedCollege.pincode}` : 'Pune Zone'}
                      </span>
                    </div>

                    <div className="detail-box detail-box-college">
                      <span className="detail-label">Confirmed College Anchor</span>
                      <span className="detail-value college-anchor-name">{selectedCollege.name}</span>
                      <span className="detail-sub">
                        {selectedCollege.affiliation} • {selectedCollege.instituteCode || 'DTE / SPPU Approved'}
                      </span>
                    </div>

                    <div className="detail-box">
                      <span className="detail-label">Gate-to-Door Perimeter</span>
                      <span className="detail-value highlight-radius">300m — 1.5km</span>
                      <span className="detail-sub">Walking radius actively mapped</span>
                    </div>
                  </div>

                  {/* Preparation Checklist & Action Section */}
                  <div className="transition-action-stage">
                    <div className="transition-audit-checklist">
                      <div className="checklist-item">
                        <IconCheck className="check-icon" />
                        <span>GPS Gate Distance Audits (Zero Estimate Fraud)</span>
                      </div>
                      <div className="checklist-item">
                        <IconCheck className="check-icon" />
                        <span>Direct Owner Contact (100% Zero Brokerage)</span>
                      </div>
                      <div className="checklist-item">
                        <IconCheck className="check-icon" />
                        <span>Curated Student Mess &amp; Wi-Fi Inspection</span>
                      </div>
                    </div>

                    {/* Interactive Alerts & Owner Pre-Registration */}
                    <div className="transition-cta-cluster">
                      {isNotified ? (
                        <div className="notified-confirmation-card">
                          <IconCheck className="w-5 h-5 text-emerald" />
                          <div>
                            <strong>You&apos;re on the priority waitlist!</strong>
                            <p>We will alert you as soon as verified PGs near {selectedCollege.shortName} open for bookings.</p>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleNotifySubmit} className="waitlist-form">
                          <input 
                            type="email" 
                            className="waitlist-email-input" 
                            placeholder="Enter your student email..." 
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            required
                          />
                          <button type="submit" className="btn-waitlist-submit">
                            <IconBell className="w-4 h-4" />
                            <span>Notify Me When Listings Go Live</span>
                          </button>
                        </form>
                      )}

                      {onOpenOwnerModal && (
                        <button 
                          type="button" 
                          className="btn-owner-callout"
                          onClick={onOpenOwnerModal}
                        >
                          <IconBuilding className="w-4 h-4" />
                          <span>Are you a PG Owner near {selectedCollege.shortName}? Pre-register with Zero Listing Fee</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Visual Composition Flow (Default State) */}
          {!selectedCollege && (
            <motion.div variants={fadeUp} className="hero-visual-composition">
              {/* Left Floating Badge: Walking Distance to Campus */}
              <div className="composition-card card-left">
                <div className="comp-icon-box bg-emerald">
                  <IconMapPin className="comp-icon text-emerald" />
                </div>
                <div className="comp-text">
                  <div className="comp-title">350m from College Gate</div>
                  <div className="comp-sub">Accurate pedestrian walk times • Morning 8 AM lectures made easy</div>
                </div>
              </div>

              {/* Center Stage Preview: Real Student Journey Card */}
              <div className="composition-center-hero">
                <div className="student-journey-badge">
                  <IconGraduationCap className="w-4 h-4 text-indigo" />
                  <span>Student Journey: Pune Campus Anchor</span>
                </div>
                <div className="student-journey-flow">
                  <div className="flow-node">
                    <span className="node-city">Pune</span>
                    <span className="node-sub">Launch City</span>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-node">
                    <span className="node-area">
                      {selectedAreaSlug === 'all' ? '73 Localities' : currentAreaObj.name}
                    </span>
                    <span className="node-sub">Locality</span>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-node">
                    <span className="node-college">
                      {selectedCollege ? selectedCollege.shortName : '39+ Campuses'}
                    </span>
                    <span className="node-sub">SPPU &amp; DTE Anchor</span>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-node flow-highlight">
                    <span className="node-result">Verified PGs</span>
                    <span className="node-sub">Zero Brokerage</span>
                  </div>
                </div>
              </div>

              {/* Right Floating Badge: Nutritious Food & Wi-Fi */}
              <div className="composition-card card-right">
                <div className="comp-icon-box bg-amber">
                  <IconSparkles className="comp-icon text-amber" />
                </div>
                <div className="comp-text">
                  <div className="comp-title">Home Mess &amp; Direct Owners</div>
                  <div className="comp-sub">Curated hygienic mess plans • Zero broker commission</div>
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </section>
  );
}
