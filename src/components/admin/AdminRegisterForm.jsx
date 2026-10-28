import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  IconShield, 
  IconLock, 
  IconMail, 
  IconPhone, 
  IconUser, 
  IconKey, 
  IconEye, 
  IconEyeOff, 
  IconSpinner, 
  IconArrowRight, 
  IconSparkles, 
  IconCheck, 
  IconAlertTriangle 
} from '../Icons';
import { requestAdminRegistration } from '../../lib/adminAuthService';
import AdminOTPVerification from './AdminOTPVerification';

export default function AdminRegisterForm({ onBackToLogin }) {
  // Form fields state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    founderVerificationNumber: '',
  });

  // Flow & OTP session state
  const [otpSession, setOtpSession] = useState(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showFounderKey, setShowFounderKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // Field change handler
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (globalError) setGlobalError('');
    if (verificationFeedback) setVerificationFeedback(null);
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#f43f5e' };
      case 2:
        return { score: 2, label: 'Fair', color: '#f59e0b' };
      case 3:
        return { score: 3, label: 'Strong', color: '#10b981' };
      case 4:
        return { score: 4, label: 'Very Strong', color: '#6366f1' };
      default:
        return { score: 0, label: '', color: '' };
    }
  }, [formData.password]);

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    // 1. Full Name
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full legal name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    }

    // 2. Username
    const cleanUsername = formData.username.trim();
    if (!cleanUsername) {
      errors.username = 'Username is required.';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      errors.username = 'Username must be 3-20 characters using letters, numbers, or underscores.';
    }

    // 3. Email Address
    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      errors.email = 'Administrator email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please provide a valid administrative email address.';
    }

    // 4. Phone Number
    const rawPhone = formData.phone.replace(/[\s\-()]/g, '');
    if (!rawPhone) {
      errors.phone = 'Operator mobile phone number is required.';
    } else if (!/^(?:\+?91)?[6-9]\d{9}$/.test(rawPhone)) {
      errors.phone = 'Enter a valid 10-digit mobile number (e.g. 9876543210).';
    }

    // 5. Password
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    // 6. Confirm Password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 7. Founder Verification Number
    if (!formData.founderVerificationNumber.trim()) {
      errors.founderVerificationNumber = 'Founder verification number is required for clearance.';
    } else if (formData.founderVerificationNumber.trim().length < 4) {
      errors.founderVerificationNumber = 'Please enter a valid founder-issued authorization number.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler: dispatches request to admin-register-request Edge Function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setVerificationFeedback(null);

    const isValid = validateForm();
    if (!isValid) {
      setGlobalError('Please resolve the highlighted validation issues before requesting clearance.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestAdminRegistration({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        founderVerificationNumber: formData.founderVerificationNumber,
      });

      // Transition to Founder OTP verification view
      setOtpSession({
        requestId: response.requestId,
        applicantEmail: formData.email.trim().toLowerCase(),
        applicantName: formData.fullName.trim(),
        password: formData.password,
        cooldownSeconds: response.cooldownSeconds,
        expiresInSeconds: response.expiresInSeconds,
        smsConfigured: response.smsConfigured,
      });
    } catch (err) {
      setGlobalError(err.message || 'Failed to dispatch authorization code. Please verify founder clearance key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    // Wipe sensitive in-memory state on navigation
    setFormData({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      founderVerificationNumber: '',
    });
    setOtpSession(null);
    onBackToLogin?.();
  };

  // If active OTP verification session exists, render the OTP screen
  if (otpSession) {
    return (
      <AdminOTPVerification
        requestId={otpSession.requestId}
        applicantEmail={otpSession.applicantEmail}
        applicantName={otpSession.applicantName}
        password={otpSession.password}
        initialCooldown={otpSession.cooldownSeconds}
        initialExpiresIn={otpSession.expiresInSeconds}
        initialSmsConfigured={otpSession.smsConfigured}
        onSuccess={({ email }) => {
          // Zero sensitive state in memory
          setFormData({
            fullName: '',
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            founderVerificationNumber: '',
          });
          setOtpSession(null);
          onBackToLogin?.(email);
        }}
        onCancel={() => {
          // Reset session and wipe password fields, return to registration form
          setOtpSession(null);
          setFormData((prev) => ({
            ...prev,
            password: '',
            confirmPassword: '',
          }));
        }}
      />
    );
  }

  return (
    <motion.div 
      className="admin-login-card admin-register-card"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Card Header */}
      <div className="card-header-section">
        <div className="admin-icon-emblem emblem-register">
          <div className="emblem-inner">
            <IconShield className="w-6 h-6 text-indigo" />
          </div>
          <div className="emblem-ring" />
        </div>

        <div className="admin-badge-pill">
          <IconSparkles className="w-3.5 h-3.5 text-indigo" />
          <span>CAMPUSNEST CONTROL CENTER</span>
        </div>

        <h1 className="admin-card-title">Admin Registration</h1>
        <p className="admin-card-subtitle">
          Secure administrator onboarding
        </p>
      </div>

      {/* Global Error Notice */}
      {globalError && (
        <motion.div 
          className="admin-security-alert error"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <IconAlertTriangle className="w-4 h-4 alert-icon" />
          <span>{globalError}</span>
        </motion.div>
      )}

      {/* Verification Feedback Banner */}
      {verificationFeedback && (
        <motion.div 
          className="admin-security-alert feedback-success"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="feedback-content">
            <div className="feedback-title-row">
              <IconCheck className="w-4 h-4 text-emerald" />
              <strong>{verificationFeedback.title}</strong>
            </div>
            <p className="feedback-text">{verificationFeedback.message}</p>
          </div>
        </motion.div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="admin-form admin-reg-form" noValidate>
        {/* Row 1: Full Name */}
        <div className="admin-form-group">
          <label htmlFor="reg-fullname" className="admin-label">
            <span>Full Name</span>
            <span className="required-star">*</span>
          </label>
          <div className="admin-input-wrapper">
            <IconUser className="input-leading-icon" />
            <input
              id="reg-fullname"
              type="text"
              className={`admin-input ${fieldErrors.fullName ? 'has-error' : ''}`}
              placeholder="e.g. Suyash Patil"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
          {fieldErrors.fullName && (
            <span className="field-error-text">{fieldErrors.fullName}</span>
          )}
        </div>

        {/* Row 2: Username & Email (Responsive 2-Col Grid) */}
        <div className="admin-form-row">
          <div className="admin-form-group col-half">
            <label htmlFor="reg-username" className="admin-label">
              <span>Username</span>
              <span className="required-star">*</span>
            </label>
            <div className="admin-input-wrapper">
              <span className="input-prefix-at">@</span>
              <input
                id="reg-username"
                type="text"
                className={`admin-input input-with-prefix ${fieldErrors.username ? 'has-error' : ''}`}
                placeholder="operator_id"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.username && (
              <span className="field-error-text">{fieldErrors.username}</span>
            )}
          </div>

          <div className="admin-form-group col-half">
            <label htmlFor="reg-email" className="admin-label">
              <span>Email Address</span>
              <span className="required-star">*</span>
            </label>
            <div className="admin-input-wrapper">
              <IconMail className="input-leading-icon" />
              <input
                id="reg-email"
                type="email"
                className={`admin-input ${fieldErrors.email ? 'has-error' : ''}`}
                placeholder="admin@campusnest.in"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email}</span>
            )}
          </div>
        </div>

        {/* Row 3: Phone Number */}
        <div className="admin-form-group">
          <label htmlFor="reg-phone" className="admin-label">
            <span>Phone Number</span>
            <span className="required-star">*</span>
          </label>
          <div className="admin-input-wrapper">
            <IconPhone className="input-leading-icon" />
            <input
              id="reg-phone"
              type="tel"
              className={`admin-input ${fieldErrors.phone ? 'has-error' : ''}`}
              placeholder="e.g. 9876543210 (10-digit mobile)"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              autoComplete="tel"
              disabled={isSubmitting}
            />
          </div>
          {fieldErrors.phone && (
            <span className="field-error-text">{fieldErrors.phone}</span>
          )}
        </div>

        {/* Row 4: Password & Confirm Password (Responsive 2-Col Grid) */}
        <div className="admin-form-row">
          <div className="admin-form-group col-half">
            <label htmlFor="reg-password" className="admin-label">
              <span>Password</span>
              <span className="required-star">*</span>
            </label>
            <div className="admin-input-wrapper">
              <IconLock className="input-leading-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`admin-input ${fieldErrors.password ? 'has-error' : ''}`}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
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
            {fieldErrors.password && (
              <span className="field-error-text">{fieldErrors.password}</span>
            )}
          </div>

          <div className="admin-form-group col-half">
            <label htmlFor="reg-confirm-password" className="admin-label">
              <span>Confirm Password</span>
              <span className="required-star">*</span>
            </label>
            <div className="admin-input-wrapper">
              <IconLock className="input-leading-icon" />
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`admin-input ${fieldErrors.confirmPassword ? 'has-error' : ''}`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="input-trailing-btn"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className="field-error-text">{fieldErrors.confirmPassword}</span>
            )}
          </div>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="password-strength-box">
            <div className="strength-meter-row">
              <div className="strength-bars">
                {[1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className="strength-bar-segment"
                    style={{
                      backgroundColor: idx <= passwordStrength.score ? passwordStrength.color : 'rgba(255, 255, 255, 0.08)'
                    }}
                  />
                ))}
              </div>
              <span className="strength-text" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
            </div>
            <span className="strength-hint">
              Use 8+ characters with uppercase, numbers, and symbols.
            </span>
          </div>
        )}

        {/* Row 5: PROTECTED FOUNDER VERIFICATION CLEARANCE SECTION */}
        <div className="founder-clearance-wrapper">
          <div className="founder-clearance-header">
            <div className="clearance-badge-row">
              <div className="clearance-icon-circle">
                <IconShield className="w-4 h-4 text-amber" />
              </div>
              <div className="clearance-title-stack">
                <span className="clearance-title">Founder Security Clearance</span>
                <span className="clearance-sub">Protected Operator Protocol</span>
              </div>
              <span className="clearance-tag">RESTRICTED</span>
            </div>
            <p className="clearance-explainer">
              To prevent unauthorized operator provisioning, a designated verification key authorized by the project founder is mandatory before dispatching your registration OTP.
            </p>
          </div>

          <div className="admin-form-group clearance-input-group">
            <label htmlFor="reg-founder-number" className="admin-label">
              <span>Founder Verification Number</span>
              <span className="required-star">*</span>
            </label>
            <div className="admin-input-wrapper">
              <IconKey className="input-leading-icon text-amber" />
              <input
                id="reg-founder-number"
                type={showFounderKey ? 'text' : 'password'}
                className={`admin-input clearance-input ${fieldErrors.founderVerificationNumber ? 'has-error' : ''}`}
                placeholder="Enter founder-issued verification key"
                value={formData.founderVerificationNumber}
                onChange={(e) => handleChange('founderVerificationNumber', e.target.value)}
                autoComplete="off"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="input-trailing-btn"
                onClick={() => setShowFounderKey(prev => !prev)}
                tabIndex={-1}
                aria-label={showFounderKey ? 'Hide verification key' : 'Show verification key'}
              >
                {showFounderKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.founderVerificationNumber && (
              <span className="field-error-text">{fieldErrors.founderVerificationNumber}</span>
            )}
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          className={`btn-admin-submit btn-send-otp ${isSubmitting ? 'is-loading' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <IconSpinner className="w-4 h-4 animate-spin" />
              <span>Dispatching Founder Authorization OTP...</span>
            </>
          ) : (
            <>
              <span>Send Founder Verification OTP</span>
              <IconArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Back to Admin Login */}
        <div className="register-actions-group">
          <button
            type="button"
            className="btn-back-to-login"
            onClick={handleBackToLogin}
            disabled={isSubmitting}
          >
            <span>← Back to Admin Login</span>
          </button>
        </div>
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
  );
}
