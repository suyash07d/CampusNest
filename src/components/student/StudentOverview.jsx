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
  IconCheck, 
  IconUser, 
  IconClock,
  IconSliders,
  IconKey,
  IconX,
  IconMapPin
} from '../Icons';
import StudentHousingJourney from './StudentHousingJourney';
import StudentCampusRadar from './StudentCampusRadar';
import StudentPreferencesMatrix from './StudentPreferencesMatrix';

export default function StudentOverview({
  user,
  profile,
  college,
  favourites = [],
  enquiries = [],
  dataLoading = false,
  onSelectTab,
  onBrowsePGs,
}) {
  const [activeModal, setActiveModal] = useState(null); // 'radar' | 'journey' | 'preferences' | null

  // Journey metrics
  const stage1Complete = Boolean(college?.id || college?.slug);
  const stage2Complete = favourites.length > 0;
  const stage3Complete = enquiries.length > 0;
  const stage4Complete = stage2Complete && stage3Complete;
  const completedCount = [stage1Complete, stage2Complete, stage3Complete, stage4Complete].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = user?.email || profile?.email || '';
  const displayPhone = profile?.phone || 'Not added';
  const isVerified = profile?.is_verified ?? false;
  const collegeName = college?.shortName || college?.name || 'Pune Campus';

  // Lock scroll when modal is active
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
    <div className="student-overview-container">
      {/* ====================================================================
          POPUP MODAL SYSTEM (Smooth Spring Animations on Card Click)
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
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="student-popup-modal-header">
                <div className="modal-title-stack">
                  <div className="modal-category-badge">
                    {activeModal === 'radar' && <><IconCompass className="w-4 h-4 text-emerald" /><span>INTERACTIVE CAMPUS RADAR</span></>}
                    {activeModal === 'journey' && <><IconGraduationCap className="w-4 h-4 text-indigo" /><span>HOUSING JOURNEY ROADMAP</span></>}
                    {activeModal === 'preferences' && <><IconSliders className="w-4 h-4 text-purple" /><span>BUDGET &amp; AMENITIES MATRIX</span></>}
                  </div>
                  <h3 className="modal-title-main">
                    {activeModal === 'radar' && `Walking Distance Radar — ${collegeName}`}
                    {activeModal === 'journey' && '4-Stage Student Housing Journey'}
                    {activeModal === 'preferences' && 'Living & Budget Preferences'}
                  </h3>
                </div>

                <button 
                  type="button" 
                  className="btn-popup-close"
                  onClick={() => setActiveModal(null)}
                  title="Close popup (Esc)"
                  aria-label="Close"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Component Body */}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          1. COMPRESSED INTERACTIVE FEATURE HUB (Bite-sized, animated cards)
          ==================================================================== */}
      <section className="overview-compressed-hub" aria-label="Interactive Feature Hub">
        <div className="compressed-hub-header">
          <div>
            <div className="section-eyebrow">FAST ACCESS DASHBOARD</div>
            <h2 className="compressed-hub-title">
              <IconSparkles className="w-4 h-4 text-indigo" />
              <span>Campus Nest Feature Hub</span>
            </h2>
          </div>
          <span className="compressed-hub-hint">Tap any box to expand full interactive view</span>
        </div>

        <div className="compressed-hub-grid">
          {/* Card 1: Interactive Campus Radar Card */}
          <motion.div 
            className="compressed-feature-card card-radar-glow"
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('radar')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('radar'); }}
          >
            <div className="compressed-card-top">
              <span className="compressed-card-badge badge-emerald">
                <span className="live-radar-dot" />
                <span>CAMPUS RADAR</span>
              </span>
              <span className="compressed-expand-hint">↗ Tap to Open</span>
            </div>

            <div className="card-center-preview">
              {/* Mini Animated Radar Graphic */}
              <div className="mini-radar-visual">
                <div className="mini-radar-ring ring-3" />
                <div className="mini-radar-ring ring-2" />
                <div className="mini-radar-ring ring-1" />
                <div className="mini-radar-scan-line" />
                <div className="mini-radar-center-dot" />
                <div className="mini-radar-ping ping-1" />
                <div className="mini-radar-ping ping-2" />
              </div>

              <div className="mini-radar-content">
                <h3 className="compressed-card-title">Walking Distance Radar</h3>
                <p className="compressed-card-desc">
                  Honest walking minutes (5m, 10m, 15m) from <strong>{collegeName}</strong> gates.
                </p>
                <div className="mini-zone-pills">
                  <span className="zone-pill pill-5m">5m (400m)</span>
                  <span className="zone-pill pill-10m">10m (800m)</span>
                  <span className="zone-pill pill-15m">15m (1.2km)</span>
                </div>
              </div>
            </div>

            <div className="compressed-card-footer">
              <span className="footer-action-text">Explore gate perimeter PGs</span>
              <span className="footer-action-icon"><IconArrowRight className="w-4 h-4" /></span>
            </div>
          </motion.div>

          {/* Card 2: Housing Journey Pipeline Card */}
          <motion.div 
            className="compressed-feature-card card-journey-glow"
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('journey')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('journey'); }}
          >
            <div className="compressed-card-top">
              <span className="compressed-card-badge badge-indigo">
                <IconGraduationCap className="w-3.5 h-3.5" />
                <span>HOUSING ROADMAP</span>
              </span>
              <span className="compressed-expand-hint">↗ Tap to Open</span>
            </div>

            <div className="card-center-preview">
              <div className="journey-summary-bar">
                <div className="journey-summary-numbers">
                  <span className="journey-stage-text">Stage {completedCount} of 4 Completed</span>
                  <span className="journey-percent-text">{progressPercent}%</span>
                </div>
                <div className="journey-mini-progress-track">
                  <motion.div 
                    className="journey-mini-progress-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <h3 className="compressed-card-title">4-Stage Move-In Pipeline</h3>
              <p className="compressed-card-desc">
                Gamified milestones from picking campus to zero-brokerage key handover.
              </p>

              <div className="journey-mini-steps-row">
                <span className={`step-chip ${stage1Complete ? 'is-done' : ''}`}>01 Campus {stage1Complete ? '✓' : ''}</span>
                <span className={`step-chip ${stage2Complete ? 'is-done' : ''}`}>02 Shortlist {stage2Complete ? '✓' : ''}</span>
                <span className={`step-chip ${stage3Complete ? 'is-done' : ''}`}>03 Visits {stage3Complete ? '✓' : ''}</span>
                <span className={`step-chip ${stage4Complete ? 'is-done' : ''}`}>04 Move-In</span>
              </div>
            </div>

            <div className="compressed-card-footer">
              <span className="footer-action-text">View full roadmap details</span>
              <span className="footer-action-icon"><IconArrowRight className="w-4 h-4" /></span>
            </div>
          </motion.div>

          {/* Card 3: Preferences & Budget Matrix Card */}
          <motion.div 
            className="compressed-feature-card card-pref-glow"
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setActiveModal('preferences')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('preferences'); }}
          >
            <div className="compressed-card-top">
              <span className="compressed-card-badge badge-purple">
                <IconSliders className="w-3.5 h-3.5" />
                <span>LIVING MATRIX</span>
              </span>
              <span className="compressed-expand-hint">↗ Tap to Open</span>
            </div>

            <div className="card-center-preview">
              <h3 className="compressed-card-title">Living &amp; Budget Matrix</h3>
              <p className="compressed-card-desc">
                Tailor accommodation rates, mess food, and room amenities.
              </p>

              <div className="pref-mini-chips-grid">
                <span className="pref-mini-chip">💰 ₹8k – ₹13k/mo</span>
                <span className="pref-mini-chip">📶 High-Speed Wi-Fi</span>
                <span className="pref-mini-chip">🚿 Attached Bath</span>
                <span className="pref-mini-chip">🌙 Flexible Curfew</span>
              </div>
            </div>

            <div className="compressed-card-footer">
              <span className="footer-action-text">Customize budget &amp; amenities</span>
              <span className="footer-action-icon"><IconArrowRight className="w-4 h-4" /></span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          2. QUICK ACTIONS SHORTCUT BAR (Compact 4-column strip)
          ==================================================================== */}
      <section className="overview-quick-strip" aria-label="Campus Nest Shortcuts">
        <button 
          type="button" 
          className="quick-strip-btn btn-strip-discover"
          onClick={() => onSelectTab('discover')}
        >
          <div className="strip-icon-box bg-indigo-glow">
            <IconCompass className="w-4 h-4 text-indigo" />
          </div>
          <div className="strip-text-stack">
            <strong>Discover PGs</strong>
            <span>Verified near campus</span>
          </div>
        </button>

        <button 
          type="button" 
          className="quick-strip-btn btn-strip-colleges"
          onClick={() => onSelectTab('discover')}
        >
          <div className="strip-icon-box bg-emerald-glow">
            <IconGraduationCap className="w-4 h-4 text-emerald" />
          </div>
          <div className="strip-text-stack">
            <strong>45+ Colleges</strong>
            <span>Pune campuses</span>
          </div>
        </button>

        <button 
          type="button" 
          className="quick-strip-btn btn-strip-saved"
          onClick={() => onSelectTab('saved')}
        >
          <div className="strip-icon-box bg-pink-glow">
            <IconHeart className="w-4 h-4 text-pink" />
          </div>
          <div className="strip-text-stack">
            <strong>Saved PGs ({favourites.length})</strong>
            <span>Compare shortlists</span>
          </div>
        </button>

        <button 
          type="button" 
          className="quick-strip-btn btn-strip-enquiries"
          onClick={() => onSelectTab('enquiries')}
        >
          <div className="strip-icon-box bg-amber-glow">
            <IconMail className="w-4 h-4 text-amber" />
          </div>
          <div className="strip-text-stack">
            <strong>Enquiries ({enquiries.length})</strong>
            <span>Visits &amp; messages</span>
          </div>
        </button>
      </section>

      {/* ====================================================================
          3. MAIN DASHBOARD SPLIT VIEW: Saved Accommodations & Activity
          ==================================================================== */}
      <div className="overview-two-col-layout">
        {/* Left Column: Saved PGs & Recent Enquiries */}
        <div className="overview-col-main">
          {/* Section: Saved PGs */}
          <section className="overview-panel-card">
            <div className="panel-card-header">
              <div className="panel-header-title">
                <IconHeart className="w-5 h-5 text-pink" />
                <h3>Saved Accommodations ({favourites.length})</h3>
              </div>
              {favourites.length > 0 && (
                <button 
                  type="button" 
                  className="panel-view-all-btn"
                  onClick={() => onSelectTab('saved')}
                >
                  <span>View All</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {favourites.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="empty-state-icon-box bg-pink-glow">
                  <IconHeart className="w-5 h-5 text-pink" />
                </div>
                <h4 className="empty-state-title">Your PG Wishlist is Empty</h4>
                <p className="empty-state-text">
                  Bookmark verified student hostels near your campus to compare room rates, food options, and gate walking times.
                </p>
                <div className="empty-state-actions">
                  <button 
                    type="button" 
                    className="btn-empty-cta primary"
                    onClick={() => onSelectTab('discover')}
                  >
                    <IconCompass className="w-4 h-4" />
                    <span>Discover PGs Near Campus</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-items-preview">
                {favourites.slice(0, 3).map((fav) => (
                  <div key={fav.id} className="overview-item-row">
                    <div className="item-row-info">
                      <h4 className="item-row-title">{fav.pg?.name || 'Verified PG Accommodation'}</h4>
                      <p className="item-row-sub">
                        📍 {fav.pg?.areas?.name || 'Pune'} • Starting ₹{fav.pg?.starting_monthly_rent?.toLocaleString('en-IN') || '—'}/mo
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn-item-action"
                      onClick={() => onSelectTab('saved')}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Recent Enquiries */}
          <section className="overview-panel-card">
            <div className="panel-card-header">
              <div className="panel-header-title">
                <IconMail className="w-5 h-5 text-amber" />
                <h3>Recent Enquiries &amp; Visits ({enquiries.length})</h3>
              </div>
              {enquiries.length > 0 && (
                <button 
                  type="button" 
                  className="panel-view-all-btn"
                  onClick={() => onSelectTab('enquiries')}
                >
                  <span>View All</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {enquiries.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="empty-state-icon-box bg-amber-glow">
                  <IconMail className="w-5 h-5 text-amber" />
                </div>
                <h4 className="empty-state-title">No Active Visit Requests</h4>
                <p className="empty-state-text">
                  Direct host inquiries and campus visit bookings will be tracked here with zero middlemen brokerage.
                </p>
                <div className="empty-state-actions">
                  <button 
                    type="button" 
                    className="btn-empty-cta primary"
                    onClick={() => onSelectTab('discover')}
                  >
                    <IconCompass className="w-4 h-4" />
                    <span>Find PGs to Enquire</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-items-preview">
                {enquiries.slice(0, 3).map((enq) => (
                  <div key={enq.id} className="overview-item-row">
                    <div className="item-row-info">
                      <div className="item-row-title-badge">
                        <h4 className="item-row-title">{enq.pg?.name || 'PG Visit Request'}</h4>
                        <span className={`status-badge badge-${enq.status || 'pending'}`}>
                          {enq.status === 'visit_scheduled' ? 'Visit Scheduled' : enq.status || 'Pending'}
                        </span>
                      </div>
                      <p className="item-row-sub">
                        {enq.visit_date ? `Scheduled for: ${enq.visit_date}` : 'Awaiting host confirmation'}
                      </p>
                    </div>
                    <button 
                      type="button" 
                      className="btn-item-action"
                      onClick={() => onSelectTab('enquiries')}
                    >
                      Track
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: College Anchor & Profile Summary */}
        <aside className="overview-col-sidebar">
          {/* College Anchor Card */}
          <section className="overview-sidebar-card college-anchor-card">
            <div className="sidebar-card-badge">
              <IconGraduationCap className="w-4 h-4 text-indigo" />
              <span>Campus Anchor</span>
            </div>

            {college ? (
              <div className="college-anchor-body">
                <h4 className="college-anchor-name">{college.name}</h4>
                <div className="college-anchor-meta">
                  <span className="anchor-tag">📍 {college.areaName || college.areaSlug}</span>
                  <span className="anchor-tag">🏛️ {college.shortName}</span>
                </div>
                <p className="college-anchor-note">
                  {college.affiliation || 'SPPU Verified Institute'}
                </p>
                <div className="college-anchor-footer">
                  <button 
                    type="button" 
                    className="btn-anchor-action"
                    onClick={() => onSelectTab('profile')}
                  >
                    Change College
                  </button>
                  <button 
                    type="button" 
                    className="btn-anchor-search"
                    onClick={() => onSelectTab('discover')}
                  >
                    <IconCompass className="w-3.5 h-3.5" />
                    <span>Explore PGs</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="college-anchor-empty">
                <h4 className="college-anchor-name">No Campus Selected</h4>
                <p className="college-anchor-note">
                  Pick your university to see accommodations measured by exact gate walking minutes.
                </p>
                <button 
                  type="button" 
                  className="btn-anchor-select"
                  onClick={() => onSelectTab('profile')}
                >
                  <IconSparkles className="w-4 h-4" />
                  <span>Select Your College</span>
                </button>
              </div>
            )}
          </section>

          {/* Profile Summary Card */}
          <section className="overview-sidebar-card profile-summary-card">
            <div className="profile-summary-header">
              <div className="profile-avatar-circle">
                {(displayName[0] || 'S').toUpperCase()}
              </div>
              <div className="profile-summary-names">
                <h4 className="profile-name">{displayName}</h4>
                <span className="profile-email" title={displayEmail}>{displayEmail}</span>
              </div>
            </div>

            <div className="profile-summary-rows">
              <div className="profile-summary-row">
                <span className="row-label">Verification:</span>
                <span className={`row-value ${isVerified ? 'text-success' : 'text-neutral'}`}>
                  {isVerified ? '✓ Verified Student' : 'Active Account'}
                </span>
              </div>

              <div className="profile-summary-row">
                <span className="row-label">Contact:</span>
                <span className="row-value">{displayPhone}</span>
              </div>

              <div className="profile-summary-row">
                <span className="row-label">City Hub:</span>
                <span className="row-value">Pune / Maharashtra</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-profile-edit"
              onClick={() => onSelectTab('profile')}
            >
              <IconUser className="w-4 h-4" />
              <span>Edit Profile &amp; Preferences</span>
            </button>
          </section>

          {/* Trust Value Box */}
          <div className="overview-trust-box">
            <div className="trust-box-header">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>Student Protection Guarantee</span>
            </div>
            <ul className="trust-box-list">
              <li><IconCheck className="w-3.5 h-3.5 text-emerald" /> 100% Zero Brokerage to Students</li>
              <li><IconCheck className="w-3.5 h-3.5 text-emerald" /> Honest Gate Walking Distances</li>
              <li><IconCheck className="w-3.5 h-3.5 text-emerald" /> Direct Contact with Verified Hosts</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
