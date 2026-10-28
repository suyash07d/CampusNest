import { motion } from 'motion/react';
import { 
  IconLayoutDashboard, 
  IconCompass, 
  IconHeart, 
  IconMail, 
  IconUser, 
  IconLogOut 
} from '../Icons';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'discover', label: 'Discover PGs', icon: IconCompass },
  { id: 'saved', label: 'Saved PGs', icon: IconHeart, hasBadge: 'saved' },
  { id: 'enquiries', label: 'My Enquiries', icon: IconMail, hasBadge: 'enquiries' },
  { id: 'profile', label: 'Profile & College', icon: IconUser },
];

export default function StudentNavigation({ 
  activeTab, 
  onSelectTab, 
  savedCount = 0, 
  enquiriesCount = 0,
  onSignOut 
}) {
  return (
    <nav className="student-nav-wrapper" aria-label="Student dashboard sections">
      <div className="student-nav-scroll-container">
        <div className="student-nav-tabs">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = item.hasBadge === 'saved' ? savedCount : item.hasBadge === 'enquiries' ? enquiriesCount : 0;

            return (
              <button
                key={item.id}
                type="button"
                className={`student-nav-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div 
                    className="student-nav-active-indicator"
                    layoutId="activeTabIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <span className="pill-content">
                  <Icon className="w-4 h-4 pill-icon" />
                  <span className="pill-label">{item.label}</span>

                  {item.hasBadge && (
                    <span className={`pill-counter-badge ${count > 0 ? 'has-count' : 'is-zero'}`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="student-nav-actions">
          <button
            type="button"
            className="student-nav-logout-btn"
            onClick={onSignOut}
            title="Log out of your account"
          >
            <IconLogOut className="w-4 h-4" />
            <span className="logout-label">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
