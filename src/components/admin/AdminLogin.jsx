import { useState } from 'react';
import { motion } from 'motion/react';
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
import './AdminLogin.css';

export default function AdminLogin({ onLogin, onGoHome, securityNotice }) {
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
            <span>CampusNest Terminal Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="admin-auth-main">
        <motion.div 
          className="admin-login-card"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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
              <span>CAMPUSNEST CONTROL CENTER</span>
            </div>

            <h1 className="admin-card-title">Administrative Gateway</h1>
            <p className="admin-card-subtitle">
              Internal authorization required. Access is restricted to verified CampusNest operators.
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
                  placeholder="admin@campusnest.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
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
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="input-trailing-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          {/* Security Notice Footer */}
          <div className="admin-card-footer">
            <div className="security-notice-row">
              <IconShield className="w-3.5 h-3.5 text-emerald" />
              <span>Protected by Supabase Row-Level Security • 256-Bit Encrypted Session</span>
            </div>
            <p className="security-disclaimer">
              Uncertified attempts to access this control center are logged with IP &amp; timestamp under PostgreSQL audit triggers.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
