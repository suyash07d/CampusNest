import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconShield, 
  IconCheck, 
  IconArrowRight, 
  IconSparkles 
} from '../Icons';
import './AdminWelcomeSplash.css';

// 12 subtle floating ambient particles for a startup-grade cinematic entrance
const AMBIENT_PARTICLES = [
  { id: 1, top: '20%', left: '15%', size: 4, delay: 0.1, duration: 4.2 },
  { id: 2, top: '35%', left: '80%', size: 5, delay: 0.4, duration: 5.1 },
  { id: 3, top: '65%', left: '18%', size: 3, delay: 0.7, duration: 4.8 },
  { id: 4, top: '75%', left: '75%', size: 4, delay: 0.2, duration: 5.4 },
  { id: 5, top: '15%', left: '60%', size: 6, delay: 0.9, duration: 4.5 },
  { id: 6, top: '50%', left: '10%', size: 3, delay: 0.5, duration: 5.8 },
  { id: 7, top: '85%', left: '40%', size: 4, delay: 1.1, duration: 4.0 },
  { id: 8, top: '25%', left: '35%', size: 5, delay: 0.3, duration: 5.2 },
  { id: 9, top: '45%', left: '90%', size: 3, delay: 0.8, duration: 4.7 },
  { id: 10, top: '10%', left: '85%', size: 4, delay: 1.3, duration: 4.9 },
  { id: 11, top: '70%', left: '60%', size: 5, delay: 0.6, duration: 5.6 },
  { id: 12, top: '30%', left: '50%', size: 3, delay: 1.0, duration: 4.3 },
];

export default function AdminWelcomeSplash({ personalization, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      onDismiss?.();
    }, 450);
  }, [exiting, onDismiss]);

  useEffect(() => {
    // Auto-advance into dashboard after 3.6 seconds
    const autoDismissTimer = setTimeout(() => {
      handleClose();
    }, 3600);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(autoDismissTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  const isEasterEgg = personalization?.isEasterEgg;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="admin-welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Admin Welcome"
        >
          {/* Ambient Multi-Hue Pulsing Glow */}
          <div className="welcome-ambient-glow" aria-hidden="true" />
          <div className="welcome-glow-secondary" aria-hidden="true" />

          {/* Subtle Floating Ambient Micro-Particles */}
          <div className="welcome-particles-layer" aria-hidden="true">
            {AMBIENT_PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className="welcome-micro-particle"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
                animate={{
                  y: [-12, 12, -12],
                  x: [-6, 6, -6],
                  opacity: [0.25, 0.75, 0.25],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Centered Glassmorphic Greeting Card */}
          <motion.div
            className={`admin-welcome-card ${isEasterEgg ? 'easter-egg-card' : ''}`}
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Security & Brand Badge */}
            <div className="welcome-card-badge-row">
              <div className="welcome-brand-chip">
                <IconShield className="w-4 h-4 text-indigo" />
                <span>CAMPUSNEST CONTROL CENTER</span>
              </div>

              {isEasterEgg ? (
                <div className="welcome-easter-egg-tag">
                  <IconSparkles className="w-3.5 h-3.5 text-amber" />
                  <span>VIP EASTER EGG</span>
                </div>
              ) : (
                <div className="welcome-status-tag">
                  <div className="pulse-dot-green" />
                  <span>SECURE SESSION</span>
                </div>
              )}
            </div>

            {/* Playful Animated Waving Hand */}
            <div className="welcome-emoji-hero">
              <motion.span
                className="wave-emoji"
                role="img"
                aria-label="Waving hand"
                animate={{
                  rotate: [0, 18, -12, 18, -8, 14, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1.8,
                  ease: 'easeInOut',
                }}
              >
                👋
              </motion.span>
            </div>

            {/* Personalized Primary Greeting */}
            <h1 className="welcome-greeting-title">
              {personalization?.welcomeGreeting || 'Welcome to CampusNest!'}
            </h1>

            {/* Sub-Greeting */}
            <p className="welcome-subgreeting-text">
              {personalization?.subGreeting || 'CampusNest Control Center is ready.'}
            </p>

            {/* Admin Verification Pill */}
            <div className="welcome-operator-pill">
              <div className="operator-avatar">
                {(personalization?.displayName || 'A')[0].toUpperCase()}
              </div>
              <div className="operator-text-group">
                <div className="operator-name-row">
                  <span className="operator-name">{personalization?.displayName}</span>
                  <span className="operator-badge">{personalization?.badge || 'Administrator'}</span>
                </div>
                <span className="operator-email">{personalization?.email}</span>
              </div>
              <div className="operator-security-mark" title="PostgreSQL RLS Active">
                <IconCheck className="w-3.5 h-3.5 text-emerald" />
                <span>Verified</span>
              </div>
            </div>

            {/* Automatic Transition Progress Strip */}
            <div className="welcome-action-footer">
              <div className="welcome-progress-track">
                <motion.div
                  className="welcome-progress-bar"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3.4, ease: 'linear' }}
                />
              </div>

              <div className="welcome-footer-controls">
                <span className="welcome-timer-hint">Auto-launching dashboard...</span>
                <button
                  type="button"
                  className="btn-enter-control-center"
                  onClick={handleClose}
                >
                  <span>Enter Control Center</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
