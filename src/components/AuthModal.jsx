import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  IconX, 
  IconGraduationCap, 
  IconBuilding, 
  IconCheck, 
  IconArrowRight, 
  IconLock, 
  IconShield,
  IconEye,
  IconEyeOff,
  IconSpinner
} from './Icons';
import './AuthModal.css';

export default function AuthModal({ onClose, onAuthSuccess, initialMode = 'login', initialRole = 'student' }) {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [role, setRole] = useState(initialRole === 'owner' ? 'owner' : 'student'); // STRICT: 'student' | 'owner' only

  // Form input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Switch between Login and Signup modes cleanly
  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setVerificationPending(false);
  };

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Field validations
    if (!email.trim() || !validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify your password confirmation.');
          setIsSubmitting(false);
          return;
        }

        // SECURITY: Role strictly locked to 'student' or 'owner'; never 'admin'
        const safeRole = role === 'owner' ? 'owner' : 'student';

        const result = await signUp({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: safeRole,
        });

        if (result?.needsEmailVerification) {
          setVerificationPending(true);
          setIsSubmitting(false);
          return;
        }

        // Successful sign up with immediate active session
        if (onAuthSuccess) {
          onAuthSuccess(safeRole);
        }
        onClose();
      } else {
        // Log in flow
        const result = await signIn({
          email: email.trim(),
          password,
        });

        const activeRole = result?.profile?.role || result?.user?.user_metadata?.role || 'student';
        if (onAuthSuccess) {
          onAuthSuccess(activeRole);
        }
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Friendly, non-technical error translation
      let message = err.message || 'Authentication failed. Please check your credentials.';
      if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please verify your login credentials.';
      } else if (message.includes('User already registered')) {
        message = 'An account with this email already exists. Please log in instead.';
      } else if (message.includes('Password should be at least')) {
        message = 'Password must be at least 6 characters long.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Please confirm your email address before logging in. Check your inbox for the link.';
      }
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="auth-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Subtle Ambient Background Glow */}
        <div className="auth-card-glow" aria-hidden="true" />

        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <IconX className="w-5 h-5" />
        </button>

        <div className="auth-modal-content">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-brand-badge">
              <IconGraduationCap className="w-4 h-4 text-indigo" />
              <span>CampusNest Auth</span>
            </div>
            <h2 id="auth-modal-title" className="auth-title">
              {mode === 'login' ? 'Welcome back' : 'Create your CampusNest account'}
            </h2>
            <p className="auth-sub">
              {mode === 'login'
                ? 'Sign in to continue your CampusNest journey.'
                : 'Join verified students and hosts finding and listing accommodations.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-mode-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-mode-tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create Account
            </button>
          </div>

          {/* Pending Email Verification Notice */}
          {verificationPending ? (
            <div className="auth-verification-box">
              <div className="verification-icon-circle">
                <IconCheck className="w-6 h-6 text-white" />
              </div>
              <h3>Confirm Your Email</h3>
              <p>
                A confirmation link has been sent to <strong>{email}</strong>. 
                Please click the link in your email to activate your CampusNest account, then return to sign in.
              </p>
              <button 
                type="button" 
                className="btn-return-login"
                onClick={() => switchMode('login')}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Error Message Alert */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    className="auth-error-alert" 
                    role="alert"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <IconShield className="w-4 h-4 text-red" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role Selection (SIGNUP ONLY) */}
              {mode === 'signup' && (
                <div className="role-selection-group">
                  <span className="form-label" id="role-select-label">Choose your account type:</span>
                  <div className="role-choice-grid" role="radiogroup" aria-labelledby="role-select-label">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={role === 'student'}
                      className={`role-choice-card ${role === 'student' ? 'is-selected' : ''}`}
                      onClick={() => setRole('student')}
                    >
                      <div className="role-choice-top">
                        <div className="role-icon-box">
                          <IconGraduationCap className="role-icon" />
                        </div>
                        <div className="role-check-indicator">
                          {role === 'student' && <IconCheck className="role-check-icon" />}
                        </div>
                      </div>
                      <div className="role-choice-info">
                        <span className="role-choice-name">Student</span>
                        <span className="role-choice-caption">Find your perfect PG</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={role === 'owner'}
                      className={`role-choice-card ${role === 'owner' ? 'is-selected' : ''}`}
                      onClick={() => setRole('owner')}
                    >
                      <div className="role-choice-top">
                        <div className="role-icon-box">
                          <IconBuilding className="role-icon" />
                        </div>
                        <div className="role-check-indicator">
                          {role === 'owner' && <IconCheck className="role-check-icon" />}
                        </div>
                      </div>
                      <div className="role-choice-info">
                        <span className="role-choice-name">PG Owner</span>
                        <span className="role-choice-caption">List and manage your PG</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name (SIGNUP ONLY) */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-fullname">Full Name</label>
                  <input
                    id="auth-fullname"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input password-input"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <IconEyeOff className="toggle-icon" />
                    ) : (
                      <IconEye className="toggle-icon" />
                    )}
                  </button>
                  <IconLock className="password-lock-icon" />
                </div>
              </div>

              {/* Confirm Password (SIGNUP ONLY) */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
                  <div className="password-input-wrap">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input password-input"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? (
                        <IconEyeOff className="toggle-icon" />
                      ) : (
                        <IconEye className="toggle-icon" />
                      )}
                    </button>
                    <IconLock className="password-lock-icon" />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <IconSpinner className="w-4 h-4" />
                    <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <IconArrowRight className="w-4 h-4 btn-arrow" />
                  </>
                )}
              </button>

              {/* Footer Switcher */}
              <div className="auth-footer-prompt">
                {mode === 'login' ? (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button 
                      type="button" 
                      className="switch-mode-btn"
                      onClick={() => switchMode('signup')}
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      className="switch-mode-btn"
                      onClick={() => switchMode('login')}
                    >
                      Sign In here
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          <div className="auth-footer-terms">
            <span>By proceeding, you agree to CampusNest&apos;s Terms of Service and Student Safety Guidelines.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
