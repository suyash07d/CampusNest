import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './AplaStayCinematicLoader.css';

/**
 * AplaStayCinematicLoader
 * Premium, futuristic, cinematic website loading animation.
 * 
 * Animation Sequence:
 * 1. Deep midnight navy fade-in with floating particles & ambient lighting.
 * 2. Animated purple-to-cyan stroke drawing the exact AplaStay house-roof arch.
 * 3. Sequential illumination of the 4 window squares.
 * 4. Location pin spring drop with expanding SVG ripple waves.
 * 5. Wordmark ("AplaStay") and official tagline ("FIND YOUR PLACE. BELONG TO MORE.") reveal.
 * 6. Smooth dissolving exit transition into the application.
 */
export default function AplaStayCinematicLoader({
  message = '',
  isReady = true,
  onComplete,
  minDuration = 2800,
  maxDuration = 4500
}) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [forceComplete, setForceComplete] = useState(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Enforce minimum display duration so animation sequence plays cleanly
  useEffect(() => {
    if (prefersReducedMotion) {
      const quickTimer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 500);
      return () => clearTimeout(quickTimer);
    }

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, prefersReducedMotion]);

  // Failsafe maximum timeout to guarantee the user is NEVER trapped on splash screen
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setForceComplete(true);
    }, maxDuration);

    return () => clearTimeout(safetyTimer);
  }, [maxDuration]);

  // When both the app is ready and min animation duration has completed (or safety timeout fired)
  const shouldExit = (isReady && minTimeElapsed) || forceComplete;

  useEffect(() => {
    if (shouldExit && onComplete) {
      // Small buffer matching the exit animation duration
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [shouldExit, onComplete]);

  // Background floating ambient particles
  const particles = useMemo(() => [
    { id: 1, top: '22%', left: '18%', size: 3, delay: '0.2s', dur: '4s' },
    { id: 2, top: '28%', right: '22%', size: 4, delay: '1.1s', dur: '5.2s' },
    { id: 3, top: '70%', left: '25%', size: 3, delay: '0.7s', dur: '4.6s' },
    { id: 4, top: '78%', right: '28%', size: 5, delay: '1.9s', dur: '6s' },
    { id: 5, top: '15%', right: '40%', size: 2, delay: '1.5s', dur: '3.8s' },
    { id: 6, top: '60%', right: '14%', size: 3, delay: '2.4s', dur: '5s' },
    { id: 7, top: '42%', left: '12%', size: 4, delay: '0.9s', dur: '4.2s' },
  ], []);

  // Render static fallback if user requested reduced motion
  if (prefersReducedMotion) {
    return (
      <AnimatePresence>
        {!shouldExit && (
          <motion.div 
            className="cinematic-loader-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="status"
            aria-live="polite"
            aria-label="Loading AplaStay"
          >
            <div className="cinematic-loader-core">
              <svg width="88" height="88" viewBox="0 0 100 100" fill="none">
                <path
                  d="M 50 14 C 52.5 14, 54.8 15.4, 56.4 17.5 L 84 50 C 86.8 53.3, 87 58, 84.5 61.5 C 82 65, 77.2 65.5, 74 62.5 L 50 34 L 26 62.5 C 22.8 65.5, 18 65, 15.5 61.5 C 13 58, 13.2 53.3, 16 50 L 43.6 17.5 C 45.2 15.4, 47.5 14, 50 14 Z"
                  fill="url(#staticRoofGrad)"
                />
                <rect x="42.5" y="38" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
                <rect x="51" y="38" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
                <rect x="42.5" y="46.5" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
                <rect x="51" y="46.5" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
                <path
                  d="M 50 58 C 45 58, 41 62, 41 67 C 41 72.5, 47 79.5, 50 83 C 53 79.5, 59 72.5, 59 67 C 59 62, 55 58, 50 58 Z"
                  fill="#8B5CF6"
                />
                <circle cx="50" cy="67" r="3.2" fill="#FFFFFF" />
                <defs>
                  <linearGradient id="staticRoofGrad" x1="12" y1="80" x2="88" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <h2 className="cinematic-brand-wordmark">
                <span className="wordmark-apla">Apla</span>
                <span className="wordmark-stay">Stay</span>
              </h2>
              <p className="cinematic-tagline">FIND YOUR PLACE. BELONG TO MORE.</p>
              {message && <p className="cinematic-status-message">{message}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {!shouldExit && (
        <motion.div 
          className="cinematic-loader-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.04, 
            filter: 'blur(10px)',
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
          }}
          transition={{ duration: 0.4 }}
          role="status"
          aria-live="polite"
          aria-label="Loading AplaStay"
        >
          {/* Ambient Lighting Orbs */}
          <div className="loader-ambient-glow glow-violet" aria-hidden="true" />
          <div className="loader-ambient-glow glow-blue" aria-hidden="true" />
          <div className="loader-ambient-glow glow-cyan" aria-hidden="true" />

          {/* Subtle Rotating Light Beam */}
          <div className="loader-light-beam" aria-hidden="true" />

          {/* Floating Dust Particles */}
          <div className="loader-particles-field" aria-hidden="true">
            {particles.map(p => (
              <span
                key={p.id}
                className="loader-particle"
                style={{
                  top: p.top,
                  left: p.left,
                  right: p.right,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDelay: p.delay,
                  animationDuration: p.dur,
                }}
              />
            ))}
          </div>

          {/* Subtle Campus Architecture Silhouette at Base */}
          <div className="loader-campus-horizon" aria-hidden="true">
            <svg viewBox="0 0 1200 180" fill="none" className="loader-campus-svg" preserveAspectRatio="none">
              <path d="M0 180 L0 140 L40 140 L40 110 L90 110 L90 140 L160 140 L160 90 L220 90 L220 140 L310 140 L310 70 L340 50 L370 70 L370 140 L460 140 L460 100 L520 100 L520 140 L600 140 L600 80 L670 80 L670 140 L760 140 L760 95 L820 95 L820 140 L900 140 L900 65 L940 45 L980 65 L980 140 L1070 140 L1070 105 L1130 105 L1130 140 L1200 140 L1200 180 Z" fill="rgba(8, 14, 32, 0.75)" />
              <rect x="180" y="105" width="6" height="8" rx="1" fill="#FBBF24" opacity="0.65" className="skyline-window" />
              <rect x="195" y="105" width="6" height="8" rx="1" fill="#67E8F9" opacity="0.65" className="skyline-window" />
              <rect x="330" y="85" width="8" height="10" rx="1" fill="#FBBF24" opacity="0.75" className="skyline-window" />
              <rect x="345" y="85" width="8" height="10" rx="1" fill="#A78BFA" opacity="0.7" className="skyline-window" />
              <rect x="620" y="98" width="7" height="9" rx="1" fill="#FBBF24" opacity="0.65" className="skyline-window" />
              <rect x="635" y="98" width="7" height="9" rx="1" fill="#38BDF8" opacity="0.7" className="skyline-window" />
              <rect x="925" y="80" width="8" height="10" rx="1" fill="#FBBF24" opacity="0.75" className="skyline-window" />
              <rect x="945" y="80" width="8" height="10" rx="1" fill="#818CF8" opacity="0.7" className="skyline-window" />
            </svg>
          </div>

          {/* Main Cinematic Core */}
          <div className="cinematic-loader-core">
            
            {/* Logo Stage */}
            <div className="cinematic-svg-stage">
              <svg 
                width="116" 
                height="116" 
                viewBox="0 0 100 100" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="cinematic-svg-root"
              >
                <defs>
                  {/* Purple-to-Cyan Roof Arch Fill Gradient */}
                  <linearGradient id="cineRoofGrad" x1="14" y1="78" x2="86" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="35%" stopColor="#8B5CF6" />
                    <stop offset="70%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>

                  {/* Gradient for Animated Stroke Line Drawing */}
                  <linearGradient id="cineStrokeGrad" x1="14" y1="78" x2="86" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="35%" stopColor="#A855F7" />
                    <stop offset="70%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>

                  {/* Pin Drop Gradient */}
                  <linearGradient id="cinePinGrad" x1="42" y1="58" x2="58" y2="84" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>

                  {/* Cinematic Drop Glow Filter */}
                  <filter id="cineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8B5CF6" floodOpacity="0.45" />
                    <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#06B6D4" floodOpacity="0.25" />
                  </filter>

                  {/* Window Glow Filter */}
                  <filter id="windowGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* 1. Animated Roof Arch Fill (Fades in once stroke outline completes) */}
                <motion.path
                  d="M 50 14
                     C 52.5 14, 54.8 15.4, 56.4 17.5
                     L 84 50
                     C 86.8 53.3, 87 58, 84.5 61.5
                     C 82 65, 77.2 65.5, 74 62.5
                     L 50 34
                     L 26 62.5
                     C 22.8 65.5, 18 65, 15.5 61.5
                     C 13 58, 13.2 53.3, 16 50
                     L 43.6 17.5
                     C 45.2 15.4, 47.5 14, 50 14 Z"
                  fill="url(#cineRoofGrad)"
                  filter="url(#cineGlow)"
                  initial={{ fillOpacity: 0 }}
                  animate={{ fillOpacity: 1 }}
                  transition={{ delay: 1.05, duration: 0.6 }}
                />

                {/* 2. Animated Outline Stroke Draw (Sequence Step 3: Draw outline) */}
                <motion.path
                  d="M 50 14
                     C 52.5 14, 54.8 15.4, 56.4 17.5
                     L 84 50
                     C 86.8 53.3, 87 58, 84.5 61.5
                     C 82 65, 77.2 65.5, 74 62.5
                     L 50 34
                     L 26 62.5
                     C 22.8 65.5, 18 65, 15.5 61.5
                     C 13 58, 13.2 53.3, 16 50
                     L 43.6 17.5
                     C 45.2 15.4, 47.5 14, 50 14 Z"
                  fill="none"
                  stroke="url(#cineStrokeGrad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* 3. Left Ribbon Fold Wall */}
                <motion.path
                  d="M 19 56
                     L 19 72
                     C 19 77, 23 81, 28 81
                     L 34 81
                     C 37 81, 39 79, 39 76
                     L 39 60
                     L 26 75
                     L 19 56 Z"
                  fill="#8B5CF6"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.92, scale: 1 }}
                  transition={{ delay: 0.95, duration: 0.5 }}
                />

                {/* 4. Right Ribbon Fold Wall */}
                <motion.path
                  d="M 81 56
                     L 81 72
                     C 81 77, 77 81, 72 81
                     L 66 81
                     C 63 81, 61 79, 61 76
                     L 61 60
                     L 74 75
                     L 81 56 Z"
                  fill="#06B6D4"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 0.92, scale: 1 }}
                  transition={{ delay: 0.95, duration: 0.5 }}
                />

                {/* 5. Four Illuminated Window Squares (Sequential illumination) */}
                {/* Window 1: Top-Left */}
                <motion.rect 
                  x="42.5" 
                  y="38" 
                  width="6.5" 
                  height="6.5" 
                  rx="1.5" 
                  fill="#FFFFFF"
                  filter="url(#windowGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.15, type: 'spring', stiffness: 480, damping: 20 }}
                />

                {/* Window 2: Top-Right */}
                <motion.rect 
                  x="51" 
                  y="38" 
                  width="6.5" 
                  height="6.5" 
                  rx="1.5" 
                  fill="#FFFFFF"
                  filter="url(#windowGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.30, type: 'spring', stiffness: 480, damping: 20 }}
                />

                {/* Window 3: Bottom-Left */}
                <motion.rect 
                  x="42.5" 
                  y="46.5" 
                  width="6.5" 
                  height="6.5" 
                  rx="1.5" 
                  fill="#FFFFFF"
                  filter="url(#windowGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.45, type: 'spring', stiffness: 480, damping: 20 }}
                />

                {/* Window 4: Bottom-Right */}
                <motion.rect 
                  x="51" 
                  y="46.5" 
                  width="6.5" 
                  height="6.5" 
                  rx="1.5" 
                  fill="#FFFFFF"
                  filter="url(#windowGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.60, type: 'spring', stiffness: 480, damping: 20 }}
                />

                {/* 6. Ripple Rings expanding outward as Pin lands */}
                <motion.circle
                  cx="50"
                  cy="82"
                  r="2"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ r: 2, opacity: 0 }}
                  animate={{ r: [2, 28], opacity: [0.95, 0] }}
                  transition={{ delay: 1.95, duration: 0.9, ease: 'easeOut' }}
                />

                {/* Second Wave Ripple */}
                <motion.circle
                  cx="50"
                  cy="82"
                  r="2"
                  stroke="#06B6D4"
                  strokeWidth="1.2"
                  fill="none"
                  initial={{ r: 2, opacity: 0 }}
                  animate={{ r: [2, 38], opacity: [0.7, 0] }}
                  transition={{ delay: 2.10, duration: 1.0, ease: 'easeOut' }}
                />

                {/* 7. Location Pin with smooth Spring Motion */}
                <motion.g
                  initial={{ y: -24, scale: 0.35, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 1.75, 
                    type: 'spring', 
                    stiffness: 420, 
                    damping: 18 
                  }}
                >
                  <path
                    d="M 50 58
                       C 45 58, 41 62, 41 67
                       C 41 72.5, 47 79.5, 50 83
                       C 53 79.5, 59 72.5, 59 67
                       C 59 62, 55 58, 50 58 Z"
                    fill="url(#cinePinGrad)"
                    filter="url(#cineGlow)"
                  />
                  {/* Pin Center Dot */}
                  <motion.circle 
                    cx="50" 
                    cy="67" 
                    r="3.2" 
                    fill="#FFFFFF"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.95, duration: 0.22 }}
                  />
                </motion.g>
              </svg>

              {/* Pulsing Floor Aura Glow under Logo */}
              <div className="logo-floor-glow" aria-hidden="true" />
            </div>

            {/* Typography & Brand Reveal (Sequence Step 7) */}
            <motion.div 
              className="cinematic-text-stack"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.10, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="cinematic-brand-wordmark">
                <span className="wordmark-apla">Apla</span>
                <span className="wordmark-stay">Stay</span>
              </h2>

              <p className="cinematic-tagline">
                FIND YOUR PLACE. BELONG TO MORE.
              </p>

              {/* Status Indicator & Live Message */}
              <div className="cinematic-status-wrap">
                <div className="cinematic-progress-track">
                  <motion.div 
                    className="cinematic-progress-bar"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.3, ease: 'easeInOut' }}
                  />
                </div>
                <span className="cinematic-status-text">
                  {message || 'Entering AplaStay student ecosystem...'}
                </span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
