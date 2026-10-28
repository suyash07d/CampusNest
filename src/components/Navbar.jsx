import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import AplaStayLogo from './AplaStayLogo';
import './AplaStayLogo.css';
import { 
  IconMapPin, 
  IconGraduationCap, 
  IconBuilding, 
  IconMenu, 
  IconX, 
  IconArrowRight, 
  IconLayoutDashboard, 
  IconLogOut,
  IconShield,
  IconSun,
  IconMoon 
} from './Icons';
import './Navbar.css';

export default function Navbar({ 
  onOpenAuth, 
  onOpenOwnerModal, 
  onScrollToDiscovery, 
  currentView = 'home',
  onNavigateHome,
  onOpenDashboard,
  onOpenAdmin 
}) {
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark / Light Mode State with Persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aplastay-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark'; // Default to AplaStay dark mode
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('aplastay-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
            <AplaStayLogo size={36} theme={theme} />
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
            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? (
                <IconSun className="theme-toggle-icon icon-sun" />
              ) : (
                <IconMoon className="theme-toggle-icon icon-moon" />
              )}
            </button>

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
                  <div className={`user-chip-avatar ${profile?.role === 'admin' ? 'avatar-admin' : role === 'owner' ? 'avatar-owner' : 'avatar-student'}`}>
                    {profile?.role === 'admin' ? <IconShield className="w-3.5 h-3.5 text-indigo" /> : role === 'owner' ? <IconBuilding className="w-3.5 h-3.5" /> : <IconGraduationCap className="w-3.5 h-3.5" />}
                  </div>
                  <span className="user-chip-name">{displayName}</span>
                </div>

                {/* Admin Control Center Button if Admin */}
                {profile?.role === 'admin' && onOpenAdmin && (
                  <button 
                    type="button"
                    className="btn-dash-nav"
                    onClick={onOpenAdmin}
                    title="Access Admin Control Center"
                  >
                    <IconShield className="w-3.5 h-3.5 text-indigo" />
                    <span>Control Center</span>
                  </button>
                )}

                {/* Dashboard Button */}
                {profile?.role !== 'admin' && (
                  <button 
                    type="button"
                    className={`btn-dash-nav ${currentView === 'dashboard' ? 'is-active' : ''}`}
                    onClick={onOpenDashboard}
                  >
                    <IconLayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>
                )}

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
                  title="Sign out of AplaStay"
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
                <AplaStayLogo size={32} theme={theme} />
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
                {/* Theme Mode Toggle Row */}
                <div className="mobile-theme-item">
                  <span className="mobile-theme-label">Theme Mode</span>
                  <button 
                    type="button" 
                    className="mobile-theme-toggle-btn"
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? (
                      <>
                        <IconSun className="w-4 h-4 text-amber" />
                        <span>Dark (Tap for Light)</span>
                      </>
                    ) : (
                      <>
                        <IconMoon className="w-4 h-4 text-indigo" />
                        <span>Light (Tap for Dark)</span>
                      </>
                    )}
                  </button>
                </div>

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
