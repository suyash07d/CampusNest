import { useState, useEffect, useCallback } from 'react';
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
import OwnerPortalHero from './components/OwnerPortalHero';
import AdminLogin from './components/admin/AdminLogin';
import AdminShell from './components/admin/AdminShell';
import AplaStayCinematicLoader from './components/AplaStayCinematicLoader';
import { IconGraduationCap, IconX, IconShield } from './components/Icons';
import './App.css';

function AplaStayContent() {
  const { 
    role, 
    isAdmin,
    profile,
    session,
    isAuthenticated, 
    loading, 
    authNotice, 
    clearAuthNotice, 
    authError, 
    clearAuthError,
    signInAdmin,
    requestPasswordRecovery,
    updateRecoveredPassword,
    isPasswordRecovery,
    signOut
  } = useAuth();

  // Pathname routing (/admin vs /) with trailing-slash normalization
  const normalizePath = (p) => (p || '').replace(/\/+$/, '') || '/';

  const [pathname, setPathname] = useState(() => 
    typeof window !== 'undefined' ? (window.location.pathname.replace(/\/+$/, '') || '/') : '/'
  );
  const [adminSecurityNotice, setAdminSecurityNotice] = useState('');

  const navigateTo = useCallback((newPath) => {
    if (typeof window !== 'undefined') {
      const cleanPath = (newPath || '').replace(/\/+$/, '') || '/';
      window.history.pushState(null, '', cleanPath);
      setPathname(cleanPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const cleanPath = (window.location.pathname || '').replace(/\/+$/, '') || '/';
      setPathname(cleanPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation state for public portal:
  // When authenticated, default view is 'dashboard' (for email confirmation & login).
  // Authenticated users can freely toggle to 'home' to explore PGs and back.
  // When unauthenticated, currentView is always 'home'.
  const [userViewOverride, setUserViewOverride] = useState(null); // 'home' | 'dashboard' | null

  // Cinematic App & Login Animation States
  const [initialMountDone, setInitialMountDone] = useState(false);
  const [authTransitioning, setAuthTransitioning] = useState(false);
  const [authTransitionMsg, setAuthTransitionMsg] = useState('');

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

  const handleAuthSuccess = (activeRole) => {
    const isOwner = activeRole === 'owner';
    const targetPortal = isOwner ? 'Property Owner Portal' : 'Student Dashboard';
    setAuthTransitionMsg(`Welcome to AplaStay! Entering ${targetPortal}...`);
    setAuthTransitioning(true);
    setUserViewOverride('dashboard');
    setAuthModalState({ isOpen: false, initialMode: 'login', initialRole: 'student' });
    if (isOwner) {
      navigateTo('/owner');
    }
  };

  const handleAdminLogin = async (creds) => {
    setAuthTransitionMsg('Authorizing administrator credentials...');
    setAuthTransitioning(true);
    try {
      await signInAdmin(creds);
    } catch (err) {
      setAuthTransitioning(false);
      throw err;
    }
  };

  // 1. Initial Cinematic Application Loading Animation
  if (!initialMountDone) {
    return (
      <AplaStayCinematicLoader 
        isReady={!loading}
        minDuration={2800}
        maxDuration={4500}
        message="Initializing verified campus network..."
        onComplete={() => setInitialMountDone(true)}
      />
    );
  }

  // 2. Cinematic Login / Role Transition Animation (Any role: Student, Owner, Admin)
  if (authTransitioning) {
    return (
      <AplaStayCinematicLoader 
        isReady={true}
        minDuration={2300}
        maxDuration={3600}
        message={authTransitionMsg || 'Entering your AplaStay portal...'}
        onComplete={() => setAuthTransitioning(false)}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Dedicated Admin Route (/admin) with Strict Security Route Guard
  // -------------------------------------------------------------------------
  if (normalizePath(pathname) === '/admin') {
    if (loading) {
      return (
        <AplaStayCinematicLoader 
          isReady={false}
          message="Verifying administrative authorization..."
          maxDuration={3500}
        />
      );
    }

    if (isPasswordRecovery) {
      return (
        <AdminLogin
          initialView="reset"
          onUpdatePassword={updateRecoveredPassword}
          onCancelPasswordRecovery={signOut}
          onLogin={handleAdminLogin}
          onGoHome={() => navigateTo('/')}
          securityNotice={adminSecurityNotice}
        />
      );
    }

    if (isAuthenticated && isAdmin) {
      return (
        <AdminShell 
          profile={profile}
          session={session}
          onSignOut={async () => {
            await signOut();
            setAdminSecurityNotice('Administrative session ended successfully.');
          }}
          onGoHome={() => navigateTo('/')}
        />
      );
    }

    return (
      <AdminLogin 
        onLogin={handleAdminLogin}
        onRequestReset={requestPasswordRecovery}
        onUpdatePassword={updateRecoveredPassword}
        onCancelPasswordRecovery={signOut}
        onGoHome={() => navigateTo('/')}
        securityNotice={isAuthenticated && !isAdmin
          ? 'This session does not have administrator access. Your current session is still active.'
          : adminSecurityNotice}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Dedicated PG Owner Portal Route (/owner, /owners, /partner)
  // -------------------------------------------------------------------------
  const isOwnerRoute = ['/owner', '/owners', '/partner'].includes(normalizePath(pathname));

  if (isOwnerRoute) {
    if (loading) {
      return (
        <AplaStayCinematicLoader 
          isReady={false}
          message="Connecting to AplaStay Host Portal..."
          maxDuration={3500}
        />
      );
    }

    if (isAuthenticated && role === 'owner') {
      return (
        <div className="app-root">
          <Navbar 
            onOpenAuth={handleOpenLogin}
            onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
            onOpenOwnerPortal={() => navigateTo('/owner')}
            onScrollToDiscovery={handleScrollToDiscovery}
            currentView="dashboard"
            onNavigateHome={() => navigateTo('/')}
            onOpenDashboard={() => navigateTo('/owner')}
            onOpenAdmin={() => navigateTo('/admin')}
          />
          <main className="main-content">
            <OwnerDashboard onGoToHome={() => navigateTo('/')} />
          </main>
          
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

    return (
      <div className="app-root">
        <Navbar 
          onOpenAuth={handleOpenLogin}
          onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
          onOpenOwnerPortal={() => navigateTo('/owner')}
          onScrollToDiscovery={handleScrollToDiscovery}
          currentView="home"
          onNavigateHome={() => navigateTo('/')}
          onOpenDashboard={() => navigateTo('/owner')}
          onOpenAdmin={() => navigateTo('/admin')}
        />
        <main className="main-content">
          <OwnerPortalHero 
            onOpenLogin={() => {
              setAuthModalState({
                isOpen: true,
                initialMode: 'login',
                initialRole: 'owner',
              });
            }}
            onOpenRegister={() => {
              setAuthModalState({
                isOpen: true,
                initialMode: 'signup',
                initialRole: 'owner',
              });
            }}
            onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
          />
        </main>
        <Footer 
          onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
          onOpenOwnerPortal={() => navigateTo('/owner')}
          onOpenAuth={handleOpenLogin}
          onOpenAdmin={() => navigateTo('/admin')}
        />

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

  // Fallback Loading Screen while Supabase resolves session / email confirmation
  if (loading) {
    return (
      <AplaStayCinematicLoader 
        isReady={false}
        message="Connecting to student session..."
        maxDuration={3500}
      />
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
        onOpenAdmin={() => navigateTo('/admin')}
        onOpenOwnerPortal={() => navigateTo('/owner')}
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
              onOpenOwnerPortal={() => navigateTo('/owner')}
            />
          </>
        )}
      </main>

      {/* 8. Footer (Only for public landing views, hidden in dashboard for zero-scroll app experience) */}
      {currentView !== 'dashboard' && (
        <Footer 
          onOpenOwnerModal={() => setIsOwnerModalOpen(true)}
          onOpenOwnerPortal={() => navigateTo('/owner')}
          onOpenAuth={handleOpenLogin}
          onOpenAdmin={() => navigateTo('/admin')}
        />
      )}

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
      <AplaStayContent />
    </AuthProvider>
  );
}

export default App;
