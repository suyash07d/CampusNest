import { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  IconGraduationCap, 
  IconShield, 
  IconCheck, 
  IconSparkles,
  IconHeart,
  IconMail
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const initial = (displayName[0] || 'S').toUpperCase();

  return (
    <motion.header 
      className="student-header-compact-bar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Left: Avatar + Greeting + College */}
      <div className="compact-header-left">
        <div className="compact-avatar-circle" title={displayEmail}>
          <span>{initial}</span>
          {isVerified && <span className="compact-avatar-check" title="Verified Student">✓</span>}
        </div>

        <div className="compact-user-info">
          <div className="compact-greeting-row">
            <span className="compact-greeting-prefix">{greeting},</span>
            <strong className="compact-user-name">{displayName}</strong>
            {isVerified ? (
              <span className="compact-verified-tag" title="Verified Account">
                <IconCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="compact-verified-tag pending" title="Active Account">
                <IconShield className="w-3 h-3" />
                <span>Student</span>
              </span>
            )}
          </div>

          <div className="compact-sub-row">
            {college ? (
              <button 
                type="button" 
                className="compact-college-pill"
                onClick={() => onSelectTab && onSelectTab('profile')}
                title="Change active college anchor"
              >
                <IconGraduationCap className="w-3.5 h-3.5 text-indigo" />
                <span>{college.shortName || college.name}</span>
                <span className="pill-area-sub">({college.areaName || college.areaSlug})</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="compact-college-pill unselected"
                onClick={() => onSelectTab && onSelectTab('profile')}
              >
                <IconSparkles className="w-3.5 h-3.5 text-amber" />
                <span>+ Set College Anchor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quick Stat Chips */}
      <div className="compact-header-right">
        <button 
          type="button" 
          className="compact-stat-chip chip-saved"
          onClick={() => onSelectTab && onSelectTab('saved')}
          title="View Saved Accommodations"
        >
          <IconHeart className="w-3.5 h-3.5 text-pink" />
          <span className="chip-count">{savedCount}</span>
          <span className="chip-label">Saved</span>
        </button>

        <button 
          type="button" 
          className="compact-stat-chip chip-enquiries"
          onClick={() => onSelectTab && onSelectTab('enquiries')}
          title="Track Enquiries & Visits"
        >
          <IconMail className="w-3.5 h-3.5 text-amber" />
          <span className="chip-count">{enquiriesCount}</span>
          <span className="chip-label">Visits</span>
        </button>

        <div className="compact-stat-chip chip-zero-brokerage">
          <span className="pulse-dot-green" />
          <span className="chip-label">Zero Brokerage</span>
        </div>
      </div>
    </motion.header>
  );
}
