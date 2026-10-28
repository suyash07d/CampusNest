import { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  IconGraduationCap, 
  IconShield, 
  IconMail, 
  IconMapPin, 
  IconCheck, 
  IconSparkles,
  IconClock
} from '../Icons';

export default function StudentHeader({ 
  profile, 
  user, 
  college, 
  savedCount = 0, 
  enquiriesCount = 0,
  onSelectTab
}) {
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = user?.email || profile?.email || '';
  const isVerified = profile?.is_verified ?? false;

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <motion.header 
      className="student-header-hero"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="header-hero-glow" aria-hidden="true" />
      
      <div className="header-hero-content">
        {/* Top Badges Row */}
        <div className="header-badges-row">
          <div className="hero-role-pill">
            <IconGraduationCap className="w-4 h-4 text-indigo" />
            <span>Student Dashboard</span>
          </div>

          {isVerified ? (
            <div className="hero-verified-pill is-verified">
              <IconCheck className="w-3.5 h-3.5 text-emerald" />
              <span>Verified Student Account</span>
            </div>
          ) : (
            <div className="hero-verified-pill is-pending">
              <IconShield className="w-3.5 h-3.5" />
              <span>Student Account Active</span>
            </div>
          )}

          <div className="hero-season-pill">
            <IconClock className="w-3.5 h-3.5 text-amber" />
            <span>2026 Academic Season</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="header-title-block">
          <h1 className="header-main-title">
            {greeting}, <span className="title-name-gradient">{displayName}</span>
          </h1>
          <p className="header-lead-desc">
            CampusNest calculates honest walking minutes from your college gates so you can discover verified PGs with zero brokerage.
          </p>
        </div>

        {/* Student Meta Details Strip */}
        <div className="header-meta-strip">
          <div className="meta-strip-item">
            <IconMail className="w-4 h-4 meta-item-icon" />
            <span className="meta-item-text" title={displayEmail}>{displayEmail}</span>
          </div>

          <div className="meta-strip-item">
            <IconMapPin className="w-4 h-4 meta-item-icon" />
            <span className="meta-item-text">Pune, Maharashtra</span>
          </div>

          {college ? (
            <button 
              type="button" 
              className="meta-strip-college-chip"
              onClick={() => onSelectTab && onSelectTab('profile')}
              title="Click to view college details"
            >
              <IconSparkles className="w-3.5 h-3.5 text-indigo" />
              <span className="college-chip-title">Anchor: <strong>{college.shortName || college.name}</strong></span>
              <span className="college-chip-area">({college.areaName || college.areaSlug})</span>
            </button>
          ) : (
            <button 
              type="button" 
              className="meta-strip-college-chip is-unselected"
              onClick={() => onSelectTab && onSelectTab('profile')}
              title="Select your college anchor"
            >
              <IconSparkles className="w-3.5 h-3.5 text-amber" />
              <span className="college-chip-action">+ Select College Anchor</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Quick Counter Stats */}
      <div className="header-stats-panel">
        <button 
          type="button" 
          className="header-stat-box"
          onClick={() => onSelectTab && onSelectTab('saved')}
        >
          <span className="stat-number">{savedCount}</span>
          <span className="stat-label">Saved PGs</span>
        </button>

        <div className="stat-divider" />

        <button 
          type="button" 
          className="header-stat-box"
          onClick={() => onSelectTab && onSelectTab('enquiries')}
        >
          <span className="stat-number">{enquiriesCount}</span>
          <span className="stat-label">Enquiries</span>
        </button>

        <div className="stat-divider" />

        <div className="header-stat-box status-indicator-box">
          <span className="stat-pulse-dot" />
          <span className="stat-label">Zero Brokerage</span>
        </div>
      </div>
    </motion.header>
  );
}
