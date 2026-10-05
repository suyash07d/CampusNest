import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconMenu, 
  IconCheck, 
  IconExternalLink,
  IconX
} from '../Icons';
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import AdminStudents from './AdminStudents';
import AdminOwners from './AdminOwners';
import AdminPGModeration from './AdminPGModeration';
import AdminEnquiries from './AdminEnquiries';
import AdminReports from './AdminReports';
import AdminActivityAudit from './AdminActivityAudit';
import AdminSettings from './AdminSettings';
import AdminWelcomeSplash from './AdminWelcomeSplash';
import { getAdminPersonalization } from '../../config/adminPersonalization';
import { getOverviewMetrics } from '../../lib/adminService';
import './AdminShell.css';

export default function AdminShell({ profile, onSignOut, onGoHome }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    pendingPGs: 0,
    openReports: 0,
    totalEnquiries: 0,
    studentsCount: 0,
    ownersCount: 0,
  });
  const [toastNotice, setToastNotice] = useState(null);
  const [selectedPGForReview, setSelectedPGForReview] = useState(null);

  // Personalized Administrator Identity & Welcome State
  const personalization = getAdminPersonalization(profile);
  const sessionKey = `cn_admin_welcome_seen_${profile?.id || profile?.email || 'admin'}`;
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(sessionKey);
  });

  const handleDismissWelcome = () => {
    setShowWelcomeSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true');
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionKey);
    }
    if (onSignOut) {
      await onSignOut();
    }
  };

  useEffect(() => {
    let isMounted = true;
    getOverviewMetrics().then(data => {
      if (isMounted) {
        setCounts({
          pendingPGs: data.pendingPGs || 0,
          openReports: data.openReports || 0,
          totalEnquiries: data.totalEnquiries || 0,
          studentsCount: data.totalStudents || 0,
          ownersCount: data.totalOwners || 0,
        });
      }
    }).catch(err => {
      console.warn('Failed to load operational badge counts:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message) => {
    setToastNotice(message);
    setTimeout(() => {
      setToastNotice((prev) => (prev === message ? null : prev));
    }, 4500);
  };

  const handleReviewPG = (pg) => {
    setSelectedPGForReview(pg);
    setActiveSection('pgs');
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview':
        return 'Overview Dashboard';
      case 'students':
        return 'Student Intelligence';
      case 'owners':
        return 'Property Owners';
      case 'pgs':
        return 'PG Listings Moderation';
      case 'enquiries':
        return 'Student Enquiries';
      case 'reports':
        return 'Trust & Safety Reports';
      case 'activity':
        return 'Activity & Demand Audit';
      case 'settings':
        return 'Settings & Security';
      default:
        return 'Control Center';
    }
  };

  return (
    <div className="admin-app-root">
      {/* Background Ambience */}
      <div className="admin-bg-gradient" aria-hidden="true" />
      <div className="admin-grid-pattern" aria-hidden="true" />

      {/* Floating Action Toast Notice */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            className="admin-toast-banner"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="toast-content">
              <IconCheck className="w-4 h-4 text-emerald" />
              <span>{toastNotice}</span>
            </div>
            <button
              type="button"
              className="btn-toast-close"
              onClick={() => setToastNotice(null)}
              aria-label="Dismiss notice"
            >
              <IconX className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personalized Welcome Experience Splash Overlay */}
      <AnimatePresence>
        {showWelcomeSplash && (
          <AdminWelcomeSplash
            personalization={personalization}
            onDismiss={handleDismissWelcome}
          />
        )}
      </AnimatePresence>

      <div className="admin-layout-container">
        {/* Navigation Sidebar */}
        <AdminSidebar
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            if (sec !== 'pgs') setSelectedPGForReview(null);
          }}
          counts={counts}
          profile={profile}
          personalization={personalization}
          onSignOut={handleSignOut}
          onGoHome={onGoHome}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Operational Stage */}
        <div className="admin-main-wrapper">
          {/* Sticky Header Bar */}
          <header className="admin-header-bar">
            <div className="header-left-group">
              <button
                type="button"
                className="btn-mobile-sidebar-toggle"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Toggle navigation menu"
              >
                <IconMenu className="w-5 h-5" />
              </button>

              <div className="header-breadcrumb">
                <span className="breadcrumb-root">CampusNest Control Center</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-active">{getSectionTitle()}</span>
              </div>
            </div>

            <div className="header-right-group">
              {/* RLS Security Live Indicator */}
              <div className="header-status-indicator" title="Database RLS is actively enforced">
                <div className="pulse-dot-green" />
                <span className="indicator-label">RLS Enforced</span>
              </div>

              {/* Public Portal Shortcut */}
              <button
                type="button"
                className="btn-header-public-link"
                onClick={onGoHome}
                title="View public student portal"
              >
                <span>Public Portal</span>
                <IconExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Admin Avatar Chip */}
              <div className="header-admin-chip">
                <div className="chip-avatar">
                  {(personalization?.displayName || profile?.full_name || 'A')[0].toUpperCase()}
                </div>
                <span className="chip-name">{personalization?.displayName || profile?.full_name || 'Admin'}</span>
              </div>
            </div>
          </header>

          {/* Section Main View Stage */}
          <main className="admin-stage-viewport">
            {activeSection === 'overview' && (
              <AdminOverview
                profile={profile}
                personalization={personalization}
                onNavigate={setActiveSection}
                onReviewPG={handleReviewPG}
              />
            )}

            {activeSection === 'students' && (
              <AdminStudents
                onShowNotice={showToast}
              />
            )}

            {activeSection === 'owners' && (
              <AdminOwners
                onShowNotice={showToast}
                onNavigateToPG={() => setActiveSection('pgs')}
              />
            )}

            {activeSection === 'pgs' && (
              <AdminPGModeration
                onShowNotice={showToast}
                initialSelectedListing={selectedPGForReview}
              />
            )}

            {activeSection === 'enquiries' && (
              <AdminEnquiries
                onShowNotice={showToast}
              />
            )}

            {activeSection === 'reports' && (
              <AdminReports
                onShowNotice={showToast}
              />
            )}

            {activeSection === 'activity' && (
              <AdminActivityAudit />
            )}

            {activeSection === 'settings' && (
              <AdminSettings
                profile={profile}
                personalization={personalization}
                onSignOut={handleSignOut}
                onGoHome={onGoHome}
                onReplayWelcome={() => setShowWelcomeSplash(true)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
