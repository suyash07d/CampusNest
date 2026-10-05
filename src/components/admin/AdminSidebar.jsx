import { 
  IconLayoutDashboard, 
  IconGraduationCap, 
  IconBuilding, 
  IconHome, 
  IconMail, 
  IconAlertTriangle, 
  IconActivity, 
  IconSettings,
  IconShield,
  IconCheck,
  IconLogOut,
  IconX,
  IconExternalLink
} from '../Icons';
import './AdminShell.css';

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  counts = {},
  profile,
  onSignOut,
  onGoHome,
  isOpenMobile,
  onCloseMobile,
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: IconLayoutDashboard,
    },
    {
      id: 'students',
      label: 'Students',
      icon: IconGraduationCap,
      badge: counts.studentsCount > 0 ? counts.studentsCount : null,
      badgeColor: 'neutral',
    },
    {
      id: 'owners',
      label: 'Owners',
      icon: IconBuilding,
      badge: counts.ownersCount > 0 ? counts.ownersCount : null,
      badgeColor: 'neutral',
    },
    {
      id: 'pgs',
      label: 'PG Listings',
      icon: IconHome,
      badge: counts.pendingPGs > 0 ? counts.pendingPGs : null,
      badgeColor: 'amber',
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: IconMail,
      badge: counts.totalEnquiries > 0 ? counts.totalEnquiries : null,
      badgeColor: 'indigo',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: IconAlertTriangle,
      badge: counts.openReports > 0 ? counts.openReports : null,
      badgeColor: 'rose',
    },
    {
      id: 'activity',
      label: 'Activity & Audit',
      icon: IconActivity,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: IconSettings,
    },
  ];

  const adminName = profile?.full_name || 'System Admin';
  const adminEmail = profile?.email || '';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}

      <aside className={`admin-sidebar-root ${isOpenMobile ? 'mobile-open' : ''}`}>
        {/* Brand header */}
        <div className="sidebar-brand-block">
          <div className="sidebar-brand-logo">
            <div className="brand-emblem-bubble">
              <IconShield className="w-5 h-5 text-indigo" />
            </div>
            <div className="brand-text-stack">
              <span className="brand-title-main">Campus<span className="brand-accent">Nest</span></span>
              <span className="brand-sub-badge">CONTROL CENTER</span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-sidebar-mobile-close" 
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Portal Switcher */}
        <div className="sidebar-portal-switch">
          <button 
            type="button" 
            className="btn-switch-portal"
            onClick={onGoHome}
            title="Go to CampusNest student portal"
          >
            <span>Public Student Portal</span>
            <IconExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav-container">
          <div className="nav-section-label">OPERATIONS &amp; DATA</div>
          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <li key={item.id} className="nav-item-wrapper">
                  <button
                    type="button"
                    className={`sidebar-nav-button ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseMobile?.();
                    }}
                  >
                    <ItemIcon className="nav-button-icon" />
                    <span className="nav-button-label">{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className={`nav-badge-pill badge-${item.badgeColor || 'neutral'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Identity & Sign Out block */}
        <div className="sidebar-bottom-block">
          <div className="admin-identity-card">
            <div className="identity-avatar-box">
              <span className="avatar-initials">
                {adminName.slice(0, 2).toUpperCase()}
              </span>
              <div className="avatar-status-dot" title="Authenticated Admin" />
            </div>
            <div className="identity-info-stack">
              <div className="identity-name-row">
                <span className="admin-name" title={adminName}>{adminName}</span>
                <span className="role-tag-admin">ADMIN</span>
              </div>
              <span className="admin-email" title={adminEmail}>{adminEmail}</span>
              <div className="identity-verified-pill">
                <IconCheck className="w-3 h-3 text-emerald" />
                <span>PostgreSQL RLS Active</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={onSignOut}
            title="Sign out of CampusNest Control Center"
          >
            <IconLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
