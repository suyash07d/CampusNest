import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  IconMapPin, 
  IconGraduationCap, 
  IconBuilding, 
  IconMenu, 
  IconX, 
  IconArrowRight, 
  IconLayoutDashboard, 
  IconLogOut 
} from './Icons';
import './Navbar.css';

export default function Navbar({ 
  onOpenAuth, 
  onOpenOwnerModal, 
  onScrollToDiscovery, 
  currentView = 'home',
  onNavigateHome,
  onOpenDashboard 
}) {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigateHome && currentView !== 'home') {
      onNavigateHome();
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-container">
          {/* Logo / Brand Area */}
          <a href="#" className="brand-logo" onClick={(e) => {
            e.preventDefault();
            if (onNavigateHome) onNavigateHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <div className="brand-icon-wrapper">
              <IconGraduationCap className="brand-cap-icon" />
              <div className="brand-dot-pulse" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Campus<span className="brand-highlight">Nest</span></span>
              <span className="brand-subtext">Near Your College</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <a 
              href="#discovery" 
              className="nav-link"
              onClick={(e) => handleLinkClick(e, 'discovery')}
            >
              <IconMapPin className="nav-link-icon" />
              <span>Find a PG</span>
            </a>
            <a 
              href="#how-it-works" 
              className="nav-link"
              onClick={(e) => handleLinkClick(e, 'how-it-works')}
            >
              <span>How it works</span>
            </a>
            <button 
              type="button" 
              className="nav-link nav-owner-link"
              onClick={onOpenOwnerModal}
            >
              <span className="owner-indicator-dot" />
              <span>For PG Owners</span>
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            {!isAuthenticated ? (
              <>
                <button 
                  type="button" 
                  className="btn-login"
                  onClick={onOpenAuth}
                  aria-label="Student or Host Login"
                >
                  Log in
                </button>
                <button 
                  type="button" 
                  className="btn-primary-nav"
                  onClick={() => {
                    if (onScrollToDiscovery) onScrollToDiscovery();
                    else {
                      const el = document.getElementById('discovery');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span>Explore PGs</span>
                  <IconArrowRight className="btn-icon-sm" />
                </button>
              </>
            ) : (
              <div className="nav-auth-group">
                {/* User Identity Chip */}
                <div className="nav-user-chip" title={`${displayName} (${user?.email})`}>
                  <div className={`user-chip-avatar ${role === 'owner' ? 'avatar-owner' : 'avatar-student'}`}>
                    {role === 'owner' ? <IconBuilding className="w-3.5 h-3.5" /> : <IconGraduationCap className="w-3.5 h-3.5" />}
                  </div>
                  <span className="user-chip-name">{displayName}</span>
                </div>

                {/* Dashboard Button */}
                <button 
                  type="button"
                  className={`btn-dash-nav ${currentView === 'dashboard' ? 'is-active' : ''}`}
                  onClick={onOpenDashboard}
                >
                  <IconLayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                {/* Home/Explore Toggle */}
                {currentView === 'dashboard' ? (
                  <button 
                    type="button"
                    className="btn-primary-nav"
                    onClick={onNavigateHome}
                  >
                    <span>Home & PGs</span>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn-primary-nav"
                    onClick={() => {
                      if (onScrollToDiscovery) onScrollToDiscovery();
                      else {
                        const el = document.getElementById('discovery');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <span>Explore PGs</span>
                    <IconArrowRight className="btn-icon-sm" />
                  </button>
                )}

                {/* Logout Button */}
                <button 
                  type="button" 
                  className="btn-logout-nav"
                  onClick={signOut}
                  title="Sign out of CampusNest"
                >
                  <IconLogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button 
            type="button" 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <IconX className="menu-icon" /> : <IconMenu className="menu-icon" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div 
              className="mobile-drawer"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <div className="brand-text-group">
                  <span className="brand-name">Campus<span className="brand-highlight">Nest</span></span>
                  <span className="brand-subtext">Verified Student Housing</span>
                </div>
                <button 
                  type="button" 
                  className="mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <IconX className="menu-icon" />
                </button>
              </div>

              {/* Logged in User Bar on Mobile */}
              {isAuthenticated && (
                <div className="mobile-user-status">
                  <div className="mobile-user-info">
                    <strong>{displayName}</strong>
                    <span>{role === 'owner' ? '🏢 PG Owner Account' : '🎓 Student Account'}</span>
                  </div>
                  <button 
                    type="button"
                    className="mobile-dash-link"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDashboard();
                    }}
                  >
                    Open Dashboard →
                  </button>
                </div>
              )}

              <div className="mobile-nav-links">
                <a 
                  href="#discovery" 
                  className="mobile-nav-link"
                  onClick={(e) => handleLinkClick(e, 'discovery')}
                >
                  <IconMapPin className="mobile-link-icon" />
                  <span>Find a PG near college</span>
                </a>
                <a 
                  href="#how-it-works" 
                  className="mobile-nav-link"
                  onClick={(e) => handleLinkClick(e, 'how-it-works')}
                >
                  <span>How it works</span>
                </a>
                <button 
                  type="button" 
                  className="mobile-nav-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOwnerModal();
                  }}
                >
                  <span>For PG Owners (List Property)</span>
                </button>
              </div>

              <div className="mobile-drawer-footer">
                {!isAuthenticated ? (
                  <>
                    <button 
                      type="button" 
                      className="mobile-btn-login"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth();
                      }}
                    >
                      Log in to Account
                    </button>
                    <button 
                      type="button" 
                      className="mobile-btn-cta"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        const el = document.getElementById('discovery');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <span>Search PGs Near Campus</span>
                      <IconArrowRight className="btn-icon-sm" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button"
                      className="mobile-btn-cta"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenDashboard();
                      }}
                    >
                      <span>Go to {role === 'owner' ? 'Owner' : 'Student'} Dashboard</span>
                    </button>
                    <button 
                      type="button" 
                      className="mobile-btn-login"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                    >
                      Log out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
