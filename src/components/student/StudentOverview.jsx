import { motion } from 'motion/react';
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
  IconClock
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
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = user?.email || profile?.email || '';
  const displayPhone = profile?.phone || 'Not added';
  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="student-overview-container">
      {/* 1. Gamified Housing Journey 4-Stage Roadmap */}
      <StudentHousingJourney 
        college={college}
        favouritesCount={favourites.length}
        enquiriesCount={enquiries.length}
        onNavigateTab={onSelectTab}
      />

      {/* 2. Interactive Concentric Campus Walking Distance Radar */}
      <StudentCampusRadar 
        currentCollege={college}
        onSelectTab={onSelectTab}
        onBrowsePGs={onBrowsePGs}
      />

      {/* 3. Quick Actions Cards Grid */}
      <section className="overview-quick-actions-section" aria-labelledby="quick-actions-heading">
        <div className="section-header-row">
          <div>
            <div className="section-eyebrow">FAST NAVIGATION</div>
            <h2 id="quick-actions-heading" className="section-subheading">
              <IconSparkles className="w-4 h-4 text-indigo" />
              <span>Campus Nest Shortcuts</span>
            </h2>
          </div>
        </div>

        <div className="quick-actions-grid">
          {/* Action 1: Discover PGs */}
          <motion.div 
            className="quick-action-card card-action-discover"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.18 }}
          >
            <div className="action-card-header">
              <div className="action-icon-box bg-indigo-glow">
                <IconCompass className="w-5 h-5 text-indigo" />
              </div>
              <span className="action-tag">Verified Listings</span>
            </div>
            <h3 className="action-card-title">Discover PGs</h3>
            <p className="action-card-desc">
              Browse student accommodations measured in walking minutes from your university gates.
            </p>
            <button 
              type="button" 
              className="action-card-btn btn-primary"
              onClick={() => onSelectTab('discover')}
            >
              <span>Explore PGs</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Action 2: Explore Colleges */}
          <motion.div 
            className="quick-action-card card-action-colleges"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.18 }}
          >
            <div className="action-card-header">
              <div className="action-icon-box bg-emerald-glow">
                <IconGraduationCap className="w-5 h-5 text-emerald" />
              </div>
              <span className="action-tag">Pune Directory</span>
            </div>
            <h3 className="action-card-title">Explore Colleges</h3>
            <p className="action-card-desc">
              Search 45+ premier institutes across Shivajinagar, Kothrud, Hinjawadi, and PCMC.
            </p>
            <button 
              type="button" 
              className="action-card-btn btn-secondary"
              onClick={() => onSelectTab('discover')}
            >
              <span>View Campuses</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Action 3: Saved PGs */}
          <motion.div 
            className="quick-action-card card-action-saved"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.18 }}
          >
            <div className="action-card-header">
              <div className="action-icon-box bg-pink-glow">
                <IconHeart className="w-5 h-5 text-pink" />
              </div>
              <span className="action-tag">{favourites.length} Shortlisted</span>
            </div>
            <h3 className="action-card-title">Saved PGs</h3>
            <p className="action-card-desc">
              Compare rents, amenities, curfew rules, and mess meals side-by-side.
            </p>
            <button 
              type="button" 
              className="action-card-btn btn-secondary"
              onClick={() => onSelectTab('saved')}
            >
              <span>View Saved</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Action 4: My Enquiries */}
          <motion.div 
            className="quick-action-card card-action-enquiries"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.18 }}
          >
            <div className="action-card-header">
              <div className="action-icon-box bg-amber-glow">
                <IconMail className="w-5 h-5 text-amber" />
              </div>
              <span className="action-tag">{enquiries.length} Active</span>
            </div>
            <h3 className="action-card-title">My Enquiries</h3>
            <p className="action-card-desc">
              Track your scheduled property visits and direct conversations with verified hosts.
            </p>
            <button 
              type="button" 
              className="action-card-btn btn-secondary"
              onClick={() => onSelectTab('enquiries')}
            >
              <span>Check Status</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 4. Student Living & Budget Preferences Matrix */}
      <StudentPreferencesMatrix 
        onBrowsePGs={onBrowsePGs}
        onSelectTab={onSelectTab}
      />

      {/* 5. Main Dashboard Split View: Saved PGs & Recent Enquiries */}
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
                  <IconHeart className="w-6 h-6 text-pink" />
                </div>
                <h4 className="empty-state-title">Your PG Wishlist is Empty</h4>
                <p className="empty-state-text">
                  You haven&apos;t saved any PGs yet. Bookmark verified student hostels near your campus to compare room rates, food options, and gate walking times.
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
                  {onBrowsePGs && (
                    <button 
                      type="button" 
                      className="btn-empty-cta secondary"
                      onClick={onBrowsePGs}
                    >
                      <span>Explore Home Radar</span>
                    </button>
                  )}
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
                <h3>Recent Enquiries & Visits ({enquiries.length})</h3>
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
                  <IconMail className="w-6 h-6 text-amber" />
                </div>
                <h4 className="empty-state-title">No Active Enquiries or Visit Requests</h4>
                <p className="empty-state-text">
                  Direct host inquiries and campus visit bookings will be tracked here with full transparency and zero middlemen brokerage.
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
              <span>Edit Profile & Preferences</span>
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
