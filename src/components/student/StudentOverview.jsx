import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconCompass, 
  IconGraduationCap, 
  IconHeart, 
  IconMail, 
  IconArrowRight, 
  IconShield, 
  IconSparkles, 
  IconSliders,
  IconX,
  IconMapPin,
  IconCheck,
  IconBuilding,
  IconUser
} from '../Icons';

import StudentCampusRadar from './StudentCampusRadar';
import StudentHousingJourney from './StudentHousingJourney';
import StudentPreferencesMatrix from './StudentPreferencesMatrix';
import StudentSaved from './StudentSaved';
import StudentEnquiries from './StudentEnquiries';

export default function StudentOverview({
  user,
  profile,
  college,
  favourites = [],
  enquiries = [],
  dataLoading = false,
  onSelectTab,
  onBrowsePGs,
  onRemoveFavourite
}) {
  // Active modal: 'radar' | 'journey' | 'preferences' | 'saved' | 'enquiries' | 'anchor' | null
  const [activeModal, setActiveModal] = useState(null);

  // Journey calculation
  const stage1Complete = Boolean(college?.id || college?.slug);
  const stage2Complete = favourites.length > 0;
  const stage3Complete = enquiries.length > 0;
  const stage4Complete = stage2Complete && stage3Complete;
  const completedCount = [stage1Complete, stage2Complete, stage3Complete, stage4Complete].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const collegeName = college?.shortName || college?.name || 'Pune Campus';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  // Lock body scroll during active popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    if (activeModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  return (
    <div className="student-compact-overview-root">
      {/* ====================================================================
          FULL-SCREEN INTERACTIVE POPUP MODALS (Triggered on Tile Click)
          ==================================================================== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            className="student-popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              className="student-popup-modal-window"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="student-popup-modal-header">
                <div className="modal-title-stack">
                  <div className="modal-category-badge">
                    {activeModal === 'radar' && <><IconCompass className="w-4 h-4 text-emerald" /><span>CAMPUS WALKING RADAR</span></>}
                    {activeModal === 'journey' && <><IconGraduationCap className="w-4 h-4 text-indigo" /><span>HOUSING JOURNEY ROADMAP</span></>}
                    {activeModal === 'preferences' && <><IconSliders className="w-4 h-4 text-purple" /><span>BUDGET &amp; AMENITIES MATRIX</span></>}
                    {activeModal === 'saved' && <><IconHeart className="w-4 h-4 text-pink" /><span>MY SAVED ACCOMMODATIONS</span></>}
                    {activeModal === 'enquiries' && <><IconMail className="w-4 h-4 text-amber" /><span>MY ENQUIRIES &amp; VISITS</span></>}
                    {activeModal === 'anchor' && <><IconMapPin className="w-4 h-4 text-cyan" /><span>CAMPUS ANCHOR &amp; PROFILE</span></>}
                  </div>
                  <h3 className="modal-title-main">
                    {activeModal === 'radar' && `Walking Distance Radar — ${collegeName}`}
                    {activeModal === 'journey' && '4-Stage Student Housing Journey'}
                    {activeModal === 'preferences' && 'Living & Budget Preferences'}
                    {activeModal === 'saved' && `Saved Accommodations (${favourites.length})`}
                    {activeModal === 'enquiries' && `Active Host Visits & Inquiries (${enquiries.length})`}
                    {activeModal === 'anchor' && `Campus Anchor — ${collegeName}`}
                  </h3>
                </div>

                <button 
                  type="button" 
                  className="btn-popup-close"
                  onClick={() => setActiveModal(null)}
                  title="Close popup (Esc)"
                  aria-label="Close popup"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="student-popup-modal-body">
                {activeModal === 'radar' && (
                  <StudentCampusRadar 
                    currentCollege={college}
                    onSelectTab={(tab) => {
                      setActiveModal(null);
                      onSelectTab(tab);
                    }}
                    onBrowsePGs={() => {
                      setActiveModal(null);
                      onBrowsePGs?.();
                    }}
                  />
                )}

                {activeModal === 'journey' && (
                  <StudentHousingJourney 
                    college={college}
                    favouritesCount={favourites.length}
                    enquiriesCount={enquiries.length}
                    onNavigateTab={(tab) => {
                      setActiveModal(null);
                      onSelectTab(tab);
                    }}
                  />
                )}

                {activeModal === 'preferences' && (
                  <StudentPreferencesMatrix 
                    onBrowsePGs={() => {
                      setActiveModal(null);
                      onBrowsePGs?.();
                    }}
                    onSelectTab={(tab) => {
                      setActiveModal(null);
                      onSelectTab(tab);
                    }}
                  />
                )}

                {activeModal === 'saved' && (
                  <StudentSaved 
                    favourites={favourites}
                    onRemoveFavourite={onRemoveFavourite}
                    onNavigateDiscover={() => {
                      setActiveModal(null);
                      onSelectTab('discover');
                    }}
                    onBrowsePGs={() => {
                      setActiveModal(null);
                      onBrowsePGs?.();
                    }}
                  />
                )}

                {activeModal === 'enquiries' && (
                  <StudentEnquiries 
                    enquiries={enquiries}
                    onNavigateDiscover={() => {
                      setActiveModal(null);
                      onSelectTab('discover');
                    }}
                    onBrowsePGs={() => {
                      setActiveModal(null);
                      onBrowsePGs?.();
                    }}
                  />
                )}

                {activeModal === 'anchor' && (
                  <div className="modal-anchor-content">
                    <div className="anchor-modal-card">
                      <div className="anchor-modal-header">
                        <div className="anchor-badge-circle">
                          <IconBuilding className="w-6 h-6 text-indigo" />
                        </div>
                        <div>
                          <h4 className="anchor-title">{college?.name || 'Select College Anchor'}</h4>
                          <p className="anchor-location">📍 {college?.areaName || college?.areaSlug || 'Pune Campus'}</p>
                        </div>
                      </div>

                      <div className="anchor-details-grid">
                        <div className="anchor-detail-row">
                          <span className="detail-label">Affiliation:</span>
                          <span className="detail-value">{college?.affiliation || 'SPPU Verified Institute'}</span>
                        </div>
                        <div className="anchor-detail-row">
                          <span className="detail-label">Student Name:</span>
                          <span className="detail-value">{displayName}</span>
                        </div>
                        <div className="anchor-detail-row">
                          <span className="detail-label">Walking Radius:</span>
                          <span className="detail-value text-emerald">5m, 10m &amp; 15m calculated</span>
                        </div>
                      </div>

                      <div className="anchor-modal-actions">
                        <button 
                          type="button" 
                          className="btn-modal-action primary"
                          onClick={() => {
                            setActiveModal(null);
                            onSelectTab('profile');
                          }}
                        >
                          <IconUser className="w-4 h-4" />
                          <span>Change College in Profile</span>
                        </button>

                        <button 
                          type="button" 
                          className="btn-modal-action secondary"
                          onClick={() => {
                            setActiveModal(null);
                            onSelectTab('discover');
                          }}
                        >
                          <IconCompass className="w-4 h-4" />
                          <span>Find PGs Near This Campus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          ULTRA-COMPACT APP BENTO GRID (Zero Endless Scrolling)
          All 6 cards fit in a compact viewport; tapping any opens the modal!
          ==================================================================== */}
      <section className="overview-bento-section" aria-label="Quick Hub Tiles">
        <div className="bento-grid-container">
          
          {/* Card 1: Walking Radar */}
          <motion.div 
            className="bento-tile tile-radar"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('radar')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('radar'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-emerald">
                <span className="live-radar-dot" />
                <span>RADAR</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-mini-radar-graphic">
                <div className="radar-sweep-line" />
                <div className="radar-ping-dot" />
              </div>
              <div className="tile-text-stack">
                <h4 className="tile-title">Campus Walking Radar</h4>
                <p className="tile-desc">5m, 10m, 15m perimeter from {collegeName} gates</p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-emerald">● Live Walking Rings</span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

          {/* Card 2: Housing Journey */}
          <motion.div 
            className="bento-tile tile-journey"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('journey')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('journey'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-indigo">
                <IconGraduationCap className="w-3 h-3" />
                <span>ROADMAP</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-text-stack full-width">
                <div className="journey-tile-progress-header">
                  <h4 className="tile-title">Stage {completedCount} of 4 Completed</h4>
                  <span className="journey-tile-percent">{progressPercent}%</span>
                </div>
                <div className="journey-tile-bar-bg">
                  <div className="journey-tile-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="tile-desc">Campus → Shortlist → Visits → Move-In</p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-indigo">Milestone Pipeline</span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

          {/* Card 3: Living Preferences */}
          <motion.div 
            className="bento-tile tile-preferences"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('preferences')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('preferences'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-purple">
                <IconSliders className="w-3 h-3" />
                <span>MATRIX</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-text-stack">
                <h4 className="tile-title">Budget &amp; Amenities</h4>
                <p className="tile-desc">₹8k – ₹13k/mo • Wi-Fi • Food • Curfew</p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-purple">Filter By Lifestyle</span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

          {/* Card 4: Saved Accommodations */}
          <motion.div 
            className="bento-tile tile-saved"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('saved')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('saved'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-pink">
                <IconHeart className="w-3 h-3" />
                <span>SAVED ({favourites.length})</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-text-stack">
                <h4 className="tile-title">Saved PG Wishlist</h4>
                <p className="tile-desc">
                  {favourites.length > 0 
                    ? `${favourites.length} accommodation${favourites.length > 1 ? 's' : ''} bookmarked` 
                    : 'Bookmark PGs near campus to compare'}
                </p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-pink">
                {favourites.length > 0 ? 'Review & Compare' : 'Explore Accommodations'}
              </span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

          {/* Card 5: Enquiries & Visits */}
          <motion.div 
            className="bento-tile tile-enquiries"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('enquiries')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('enquiries'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-amber">
                <IconMail className="w-3 h-3" />
                <span>ENQUIRIES ({enquiries.length})</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-text-stack">
                <h4 className="tile-title">Visits &amp; Direct Enquiries</h4>
                <p className="tile-desc">
                  {enquiries.length > 0 
                    ? `${enquiries.length} active visit${enquiries.length > 1 ? 's' : ''} in progress`
                    : 'Zero-brokerage host booking inquiries'}
                </p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-amber">
                {enquiries.length > 0 ? 'Track Status' : 'Book a Property Tour'}
              </span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

          {/* Card 6: Campus Anchor */}
          <motion.div 
            className="bento-tile tile-anchor"
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('anchor')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('anchor'); }}
          >
            <div className="tile-top-row">
              <span className="tile-badge badge-cyan">
                <IconMapPin className="w-3 h-3" />
                <span>CAMPUS ANCHOR</span>
              </span>
              <span className="tile-expand-tag">↗ Tap to Open</span>
            </div>

            <div className="tile-body-row">
              <div className="tile-text-stack">
                <h4 className="tile-title">{collegeName}</h4>
                <p className="tile-desc">
                  {college?.areaName ? `📍 ${college.areaName} • SPPU Verified` : 'Anchor your university gates'}
                </p>
              </div>
            </div>

            <div className="tile-footer-row">
              <span className="tile-metric-highlight text-cyan">Change / Verify Campus</span>
              <span className="tile-action-arrow"><IconArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </motion.div>

        </div>

        {/* Compact Single-Row Quick Action Bar */}
        <div className="overview-bottom-action-bar">
          <button 
            type="button" 
            className="btn-compact-discover-hero"
            onClick={() => onSelectTab('discover')}
          >
            <IconCompass className="w-4 h-4" />
            <span>Discover Verified PGs Near {collegeName}</span>
            <IconArrowRight className="w-4 h-4 icon-arrow" />
          </button>

          <div className="overview-compact-trust-tag">
            <IconShield className="w-4 h-4 text-emerald" />
            <span>100% Zero Brokerage to Students • Direct Host Verification</span>
          </div>
        </div>
      </section>
    </div>
  );
}
