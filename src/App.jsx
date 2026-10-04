import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustValueStrip from './components/TrustValueStrip';
import DiscoveryPreview from './components/DiscoveryPreview';
import HowItWorks from './components/HowItWorks';
import OwnerSection from './components/OwnerSection';
import Footer from './components/Footer';
import PGDetailModal from './components/PGDetailModal';
import OwnerModal from './components/OwnerModal';
import AuthModal from './components/AuthModal';
import StudentDashboard from './components/StudentDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import { IconGraduationCap, IconX, IconShield } from './components/Icons';
import './App.css';

function CampusNestContent() {
  const { 
    role, 
    isAuthenticated, 
    loading, 
    authNotice, 
    clearAuthNotice, 
    authError, 
    clearAuthError 
  } = useAuth();

  // Navigation state:
  // When authenticated, default view is 'dashboard' (for email confirmation & login).
  // Authenticated users can freely toggle to 'home' to explore PGs and back.
  // When unauthenticated, currentView is always 'home'.
  const [userViewOverride, setUserViewOverride] = useState(null); // 'home' | 'dashboard' | null

  const currentView = isAuthenticated ? (userViewOverride || 'dashboard') : 'home';

  const [searchParams, setSearchParams] = useState({
    city: 'pune',
    area: 'shivajinagar',
    college: 'coep-technological-university-shivajinagar-pune',
    collegeObj: null,
  });

  const [activeFilters, setActiveFilters] = useState({
    girlsOnly: false,
    boysOnly: false,
    coed: false,
    mealsIncluded: false,
    walkingDistance: false,
  });

  const [selectedPG, setSelectedPG] = useState(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    initialMode: 'login',
    initialRole: 'student',
  });

  const handleSearchSubmit = (params) => {
    setSearchParams(params);
  };

  const handleScrollToDiscovery = () => {
    setUserViewOverride('home');
    setTimeout(() => {
      const el = document.getElementById('discovery');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleOpenLogin = () => {
    setAuthModalState({
      isOpen: true,
      initialMode: 'login',
      initialRole: 'student',
    });
  };

  const handleAuthSuccess = () => {
    setUserViewOverride('dashboard');
    setAuthModalState({ isOpen: false, initialMode: 'login', initialRole: 'student' });
  };

  // Loading Screen while Supabase resolves session / email confirmation
  if (loading) {
    return (
      <div className="auth-loading-screen" aria-label="Loading student session">
        <div className="auth-loading-card">
          <div className="loading-logo-box">
            <IconGraduationCap className="loading-cap-icon" />
            <div className="loading-dot-pulse" />
          </div>
          <div className="loading-text-stack">
            <span className="loading-brand">Campus<span className="brand-highlight">Nest</span></span>
            <span className="loading-status">Connecting to student session...</span>
          </div>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* 1. Premium Sticky Navbar */}
      <Navbar 
        onOpenAuth={handleOpenLogin}
        onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
        onScrollToDiscovery={handleScrollToDiscovery}
        currentView={currentView}
        onNavigateHome={() => setUserViewOverride('home')}
        onOpenDashboard={() => setUserViewOverride('dashboard')}
      />

      {/* Global Confirmation / Notification Alert */}
      {authNotice && (
        <div className="auth-global-banner banner-success">
          <div className="container banner-inner">
            <span className="banner-text">{authNotice}</span>
            <button 
              type="button" 
              className="banner-close-btn"
              onClick={clearAuthNotice}
              aria-label="Dismiss notification"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Auth Error Alert (e.g. Expired confirmation link) */}
      {authError && (
        <div className="auth-global-banner banner-error">
          <div className="container banner-inner">
            <div className="banner-error-content">
              <IconShield className="w-4 h-4 text-red" />
              <span className="banner-text">{authError}</span>
            </div>
            <div className="banner-action-group">
              <button
                type="button"
                className="banner-action-btn"
                onClick={() => {
                  clearAuthError();
                  handleOpenLogin();
                }}
              >
                Log in
              </button>
              <button 
                type="button" 
                className="banner-close-btn"
                onClick={clearAuthError}
                aria-label="Dismiss alert"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        {/* Render View: Role Dashboard or Landing Experience */}
        {currentView === 'dashboard' && isAuthenticated ? (
          role === 'owner' ? (
            <OwnerDashboard onGoToHome={() => setUserViewOverride('home')} />
          ) : (
            <StudentDashboard onBrowsePGs={handleScrollToDiscovery} />
          )
        ) : (
          <>
            {/* 2 & 3. Hero & Main PG Discovery Search */}
            <Hero 
              onSearchSubmit={handleSearchSubmit}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
            />

            {/* 4. Trust / Value Strip */}
            <TrustValueStrip />

            {/* 5. Feature Preview (Pune Campus Discovery Hub & PG Radar) */}
            <DiscoveryPreview 
              searchParams={searchParams}
              activeFilters={activeFilters}
              onSelectCollege={(college) => setSearchParams(prev => ({
                ...prev,
                city: 'pune',
                area: college.areaSlug,
                college: college.slug,
                collegeObj: college,
              }))}
              onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
            />

            {/* 6. How It Works (3 Steps) */}
            <HowItWorks 
              onGetStarted={handleScrollToDiscovery}
            />

            {/* 7. For PG Owners */}
            <OwnerSection 
              onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
            />
          </>
        )}
      </main>

      {/* 8. Footer */}
      <Footer 
        onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
        onOpenAuth={handleOpenLogin}
      />

      {/* Interactive Modals with smooth exit transitions */}
      <AnimatePresence>
        {selectedPG && (
          <PGDetailModal 
            key="pg-detail-modal"
            pg={selectedPG}
            onClose={() => setSelectedPG(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOwnerModalOpen && (
          <OwnerModal 
            key="owner-modal"
            onClose={() => setIsOwnerModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authModalState.isOpen && (
          <AuthModal 
            key="auth-modal"
            initialMode={authModalState.initialMode}
            initialRole={authModalState.initialRole}
            onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );

}

function App() {
  return (
    <AuthProvider>
      <CampusNestContent />
    </AuthProvider>
  );
}

export default App;
