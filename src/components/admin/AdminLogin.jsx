import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconShield, 
  IconLock, 
  IconMail, 
  IconEye, 
  IconEyeOff, 
  IconSpinner, 
  IconArrowRight, 
  IconSparkles
} from '../Icons';
import AdminPasswordRecovery from './AdminPasswordRecovery';
import './AdminLogin.css';

export default function AdminLogin({ onLogin, onGoHome, securityNotice, initialView = 'login', onRequestReset, onUpdatePassword, onCancelPasswordRecovery }) {
  const [view, setView] = useState(initialView); // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin({ email: email.trim(), password });
    } catch (err) {
      console.error('Admin login error:', err);
      let msg = err.message || 'Authentication failed. Please verify your credentials.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid credentials. Administrative authorization could not be verified.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-auth-root">
      {/* Ambient background glows */}
      <div className="admin-glow-blob blob-top-left" aria-hidden="true" />
      <div className="admin-glow-blob blob-bottom-right" aria-hidden="true" />
      <div className="admin-grid-pattern" aria-hidden="true" />

      {/* Top Bar with back link */}
      <header className="admin-auth-header">
        <div className="container header-flex">
          <button 
            type="button" 
            className="btn-back-portal"
            onClick={onGoHome}
          >
            <span>← Return to Student Portal</span>
          </button>
          <div className="admin-live-pulse-badge">
            <span className="live-dot" />
            <span>AplaStay Admin</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-auth-main">
        <AnimatePresence mode="wait">
          {view === 'login' ? (
            <motion.div 
              key="admin-login-view"
              className="admin-login-card"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card Header */}
              <div className="card-header-section">
                <div className="admin-icon-emblem">
                  <div className="emblem-inner">
                    <IconShield className="w-6 h-6 text-indigo" />
                  </div>
                  <div className="emblem-ring" />
                </div>

                <div className="admin-badge-pill">
                  <IconSparkles className="w-3.5 h-3.5 text-indigo" />
                  <span>ADMINISTRATOR SIGN IN</span>
                </div>

                <h1 className="admin-card-title">Welcome back</h1>
                <p className="admin-card-subtitle">
                  Sign in with an account that has administrator access.
                </p>
              </div>

              {/* Security Notice (e.g. redirected from unauthorized attempt) */}
              {securityNotice && (
                <div className="admin-security-alert notice">
                  <IconShield className="w-4 h-4 alert-icon" />
                  <span>{securityNotice}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <motion.div 
                  className="admin-security-alert error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                >
                  <IconLock className="w-4 h-4 alert-icon" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="admin-form" noValidate>
                {/* Email Field */}
                <div className="admin-form-group">
                  <label htmlFor="admin-email" className="admin-label">
                    <span>Administrator Email</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="admin-input-wrapper">
                    <IconMail className="input-leading-icon" />
                    <input 
                      id="admin-email"
                      type="email"
                      className="admin-input"
                      placeholder="admin@aplastay.in"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck="false"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="admin-form-group">
                  <label htmlFor="admin-password" className="admin-label">
                    <span>Password</span>
                    <span className="required-star">*</span>
                  </label>
                  <div className="admin-input-wrapper">
                    <IconLock className="input-leading-icon" />
                    <input 
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      className="admin-input"
                      placeholder="Enter administrator password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="input-trailing-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className={`btn-admin-submit ${isSubmitting ? 'is-loading' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <IconSpinner className="w-4 h-4 animate-spin" />
                      <span>Verifying Authorization...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate Session</span>
                      <IconArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="admin-forgot-row">
                <button type="button" className="btn-admin-text-link" onClick={() => { setErrorMessage(''); setView('forgot'); }}>
                  Forgot password?
                </button>
              </div>

              {/* Security Notice Footer */}
              <div className="admin-card-footer">
                <div className="security-notice-row">
                  <IconShield className="w-3.5 h-3.5 text-emerald" />
                  <span>Secure sign-in • Administrator role verified</span>
                </div>
                <p className="security-disclaimer">
                  Only accounts with administrator permissions can open the control center.
                </p>
              </div>
            </motion.div>
          ) : view === 'forgot' || view === 'reset' ? (
            <AdminPasswordRecovery
              key={`admin-${view}-view`}
              mode={view}
              email={email}
              onEmailChange={setEmail}
              onBack={() => {
                setErrorMessage('');
                if (view === 'reset') onCancelPasswordRecovery?.();
                setView('login');
              }}
              onRequestReset={onRequestReset}
              onUpdatePassword={onUpdatePassword}
            />
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
