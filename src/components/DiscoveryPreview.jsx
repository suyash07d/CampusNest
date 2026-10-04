import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  IconArrowRight
} from './Icons';
import './DiscoveryPreview.css';

const STREAM_TABS = [
  { id: 'all', label: 'All Streams (45)' },
  { id: 'Engineering', label: 'Engineering & Tech' },
  { id: 'Management', label: 'Management / MBA' },
  { id: 'Science', label: 'Arts & Science' },
  { id: 'Commerce', label: 'Commerce' },
  { id: 'Law', label: 'Law' },
  { id: 'Pharmacy', label: 'Pharmacy' },
  { id: 'Architecture', label: 'Architecture' },
  { id: 'Medical', label: 'Medical' },
];

export default function DiscoveryPreview({ searchParams, onSelectCollege, onOpenOwnerModal }) {
  const [activeStream, setActiveStream] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isWaitlistSuccess, setIsWaitlistSuccess] = useState(false);

  // Identify active college anchor from searchParams or fallback to COEP
  const activeCollege = useMemo(() => {
    if (searchParams?.collegeObj) return searchParams.collegeObj;
    if (searchParams?.college) {
      const match = PUNE_COLLEGES.find(c => c.slug === searchParams.college || c.id === searchParams.college);
      if (match) return match;
    }
    // Default fallback to first verified college
    return PUNE_COLLEGES[0];
  }, [searchParams]);

  // Filter colleges based on stream tab and filterQuery
  const filteredColleges = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return PUNE_COLLEGES.filter(c => {
      // Stream filter
      if (activeStream !== 'all') {
        const hasStream = c.categories.some(cat => 
          cat.toLowerCase().includes(activeStream.toLowerCase())
        );
        if (!hasStream) return false;
      }
      // Query filter
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchShort = c.shortName.toLowerCase().includes(q);
        const matchArea = c.areaSlug.toLowerCase().includes(q);
        const matchPincode = c.pincode ? c.pincode.includes(q) : false;
        const matchAliases = c.aliases ? c.aliases.some(a => a.toLowerCase().includes(q)) : false;
        if (!matchName && !matchShort && !matchArea && !matchPincode && !matchAliases) {
          return false;
        }
      }
      return true;
    });
  }, [activeStream, filterQuery]);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (studentEmail) {
      setIsWaitlistSuccess(true);
    }
  };

  const handleCollegePick = (college) => {
    if (onSelectCollege) {
      onSelectCollege(college);
    }
    const el = document.getElementById('discovery');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="discovery" className="discovery-section" aria-label="Pune Campus PG Discovery Hub">
      <div className="container">
        
        {/* Verification Mission Alert */}
        <div className="demo-disclaimer-card">
          <div className="disclaimer-icon-wrap">
            <IconShield className="disclaimer-icon" />
          </div>
          <div className="disclaimer-text">
            <strong>CampusNest Pune Verification Mission</strong>: We are currently conducting on-the-ground 
            audits of student accommodations, PGs, and mess providers within walking radius of 45+ official SPPU 
            and DTE Maharashtra campuses. Zero fabricated distances. Zero broker surprise charges.
          </div>
        </div>

        {/* Section Header */}
        <motion.div 
          className="discovery-header-row"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="discovery-titles">
            <div className="discovery-badge">
              <IconSparkles className="w-4 h-4 text-indigo" />
              <span>PUNE CAMPUS DISCOVERY &amp; PG RADAR</span>
            </div>
            <h2 className="discovery-main-title">
              PG discovery for this college is coming next
            </h2>
            <p className="discovery-subtitle">
              CampusNest is actively indexing gate-measured student housing for verified Pune institutions.
              Select any college anchor below to check audit status or register for early access.
            </p>
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* ACTIVE CAMPUS ANCHOR SPOTLIGHT CARD (Requirement 6)               */}
        {/* ================================================================= */}
        {activeCollege && (
          <motion.div 
            className="active-anchor-spotlight"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="spotlight-card">
              <div className="spotlight-header">
                <div className="spotlight-badge-group">
                  <span className="spotlight-live-pulse" />
                  <span className="spotlight-tag">ACTIVE CAMPUS ANCHOR</span>
                  <span className="spotlight-code">{activeCollege.instituteCode || 'SPPU / DTE Approved'}</span>
                </div>
                {activeCollege.website && (
                  <a 
                    href={activeCollege.website}
                    target="_blank"
                    rel="noreferrer"
                    className="spotlight-website-link"
                  >
                    <span>Visit College Portal</span>
                    <IconExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="spotlight-body">
                <div className="spotlight-college-meta">
                  <div className="spotlight-acronym">{activeCollege.shortName}</div>
                  <h3 className="spotlight-name">{activeCollege.name}</h3>
                  <div className="spotlight-location-row">
                    <span className="spotlight-loc-item">
                      <IconMapPin className="w-4 h-4 text-indigo" />
                      <strong>{activeCollege.areaName}</strong>, Pune
                    </span>
                    {activeCollege.pincode && (
                      <span className="spotlight-pincode">PIN: {activeCollege.pincode}</span>
                    )}
                    <span className="spotlight-affil">{activeCollege.affiliation}</span>
                  </div>
                  {activeCollege.address && (
                    <p className="spotlight-address">📍 Address: {activeCollege.address}</p>
                  )}
                </div>

                <div className="spotlight-audit-panel">
                  <div className="audit-panel-title">PG Onboarding Status for this Campus:</div>
                  <div className="audit-checklist">
                    <div className="audit-item">
                      <IconCheck className="w-4 h-4 text-emerald" />
                      <span>Walking Perimeter: 300m — 1.5km Calibrated</span>
                    </div>
                    <div className="audit-item">
                      <IconCheck className="w-4 h-4 text-emerald" />
                      <span>Zero Brokerage Owner Direct Rate Audits</span>
                    </div>
                    <div className="audit-item">
                      <IconCheck className="w-4 h-4 text-emerald" />
                      <span>Curated Mess &amp; Hygienic Meal Verification</span>
                    </div>
                  </div>

                  {/* Student Alert Waitlist */}
                  <div className="spotlight-action-box">
                    {isWaitlistSuccess ? (
                      <div className="spotlight-alert-confirmed">
                        <IconCheck className="w-4 h-4 text-emerald" />
                        <span>Registered! We&apos;ll notify you when rooms near {activeCollege.shortName} go live.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleWaitlistSubmit} className="spotlight-waitlist-form">
                        <input 
                          type="email"
                          placeholder="Enter student email for priority room alerts..."
                          className="spotlight-email-input"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          required
                        />
                        <button type="submit" className="spotlight-submit-btn">
                          <IconBell className="w-4 h-4" />
                          <span>Get Notified</span>
                        </button>
                      </form>
                    )}

                    {onOpenOwnerModal && (
                      <button 
                        type="button" 
                        className="spotlight-owner-btn"
                        onClick={onOpenOwnerModal}
                      >
                        <IconBuilding className="w-4 h-4" />
                        <span>PG Owner near {activeCollege.shortName}? Pre-register your property</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================= */}
        {/* INTERACTIVE PUNE CAMPUS DIRECTORY                                 */}
        {/* ================================================================= */}
        <div className="campus-directory-container">
          <div className="directory-header-controls">
            <div>
              <h3 className="directory-title">
                Explore 45+ Verified Pune Institutions
              </h3>
              <p className="directory-sub">
                Click any institution to set as your anchor and view locality onboarding details.
              </p>
            </div>

            {/* Live Search inside directory */}
            <div className="directory-search-wrapper">
              <IconSearch className="directory-search-icon" />
              <input 
                type="text" 
                placeholder="Search college, acronym (COEP, MIT...), or PIN..." 
                className="directory-search-input"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Academic Stream Tabs */}
          <div className="discovery-tabs-bar">
            {STREAM_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab-btn ${activeStream === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveStream(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* College Cards Grid */}
          <div className="colleges-cards-grid">
            <AnimatePresence mode="popLayout">
              {filteredColleges.map((college, idx) => {
                const isCurrentAnchor = activeCollege?.slug === college.slug;
                const areaInfo = PUNE_AREAS.find(a => a.slug === college.areaSlug);

                return (
                  <motion.article 
                    key={college.slug}
                    className={`college-directory-card ${isCurrentAnchor ? 'is-active-anchor' : ''}`}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    onClick={() => handleCollegePick(college)}
                  >
                    <div className="card-top-row">
                      <span className="card-acronym-badge">{college.shortName}</span>
                      <span className="card-area-tag">
                        📍 {areaInfo?.name || college.areaName}
                      </span>
                    </div>

                    <h4 className="card-college-name">{college.name}</h4>

                    <div className="card-affiliation-text">
                      {college.affiliation}
                    </div>

                    <div className="card-categories-row">
                      {college.categories.slice(0, 3).map(cat => (
                        <span key={cat} className="card-cat-pill">{cat}</span>
                      ))}
                      {college.categories.length > 3 && (
                        <span className="card-cat-more">+{college.categories.length - 3}</span>
                      )}
                    </div>

                    <div className="card-footer-action">
                      <div className="card-institute-code">
                        {college.instituteCode || 'SPPU Verified'}
                      </div>
                      <button 
                        type="button" 
                        className={`card-select-btn ${isCurrentAnchor ? 'btn-is-selected' : ''}`}
                      >
                        {isCurrentAnchor ? (
                          <>
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Active Anchor</span>
                          </>
                        ) : (
                          <>
                            <span>Select Campus</span>
                            <IconArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
