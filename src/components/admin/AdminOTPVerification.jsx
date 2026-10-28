// ==========================================================================
// CampusNest Admin OTP Verification
// Secure 6-Digit Founder Clearance Verification Modal & Onboarding Finalizer
// ==========================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IconShield,
  IconLock,
  IconClock,
  IconRefreshCw,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
  IconSpinner,
} from '../Icons';
import {
  verifyAdminRegistrationOtp,
  resendAdminRegistrationOtp,
} from '../../lib/adminAuthService';

export default function AdminOTPVerification({
  requestId,
  applicantEmail,
  applicantName,
  password,
  initialCooldown = 60,
  initialExpiresIn = 600,
  initialSmsConfigured = true,
  onSuccess,
  onCancel,
}) {
  // 6-digit OTP box states
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);

  // Flow and lifecycle states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [resendsRemaining, setResendsRemaining] = useState(3);
  const [smsConfigured, setSmsConfigured] = useState(initialSmsConfigured);
  const [isSuccess, setIsSuccess] = useState(false);

  // Timers
  const [expireCountdown, setExpireCountdown] = useState(initialExpiresIn);
  const [resendCooldown, setResendCooldown] = useState(initialCooldown);

  // Derived state: expired when countdown reaches zero
  const isExpired = expireCountdown <= 0;

  // Auto-focus the first empty digit box on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Expiration countdown effect (10-minute TTL)
  useEffect(() => {
    if (isSuccess || isLocked || expireCountdown <= 0) return;

    const timer = setInterval(() => {
      setExpireCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expireCountdown, isSuccess, isLocked]);

  // Resend cooldown timer (60-second limit)
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format countdown seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    if (isLocked || isSuccess) return;

    // Filter only numeric character
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newChar = cleanVal.slice(-1); // Take last character entered
    const newDigits = [...digits];
    newDigits[index] = newChar;
    setDigits(newDigits);
    setErrorMessage('');

    // Advance focus to next input if filled
    if (newChar && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace, left, right arrow keys
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle full OTP paste (e.g. copied from SMS or authentication token)
  const handlePaste = (e) => {
    e.preventDefault();
    if (isLocked || isSuccess) return;

    const pastedText = e.clipboardData.getData('text') || '';
    const cleanNumbers = pastedText.replace(/\D/g, '').slice(0, 6);

    if (!cleanNumbers) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = cleanNumbers[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage('');

    // Focus either the next empty box or the 6th box
    const nextEmptyIndex = newDigits.findIndex((d) => d === '');
    if (nextEmptyIndex !== -1) {
      inputsRef.current[nextEmptyIndex]?.focus();
    } else {
      inputsRef.current[5]?.focus();
    }
  };

  // Verify OTP submission
  const handleVerify = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (isVerifying || isLocked || isSuccess) return;

    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter all 6 numeric digits of the authorization code.');
      return;
    }

    if (isExpired) {
      setErrorMessage('This verification code has expired. Please request a new OTP.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setStatusFeedback('');

    try {
      const result = await verifyAdminRegistrationOtp({
        requestId,
        otp: otpCode,
        password,
      });

      setIsSuccess(true);
      setStatusFeedback(result.message || 'Administrator account provisioned successfully.');

      // Automatically transition to login after brief celebratory pause
      setTimeout(() => {
        onSuccess?.({ email: result.email || applicantEmail });
      }, 2400);
    } catch (err) {
      const message = err.message || 'Verification failed.';
      setErrorMessage(message);

      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
        if (err.remainingAttempts === 0) {
          setIsLocked(true);
        }
      }

      if (err.status === 423) {
        setIsLocked(true);
      } else if (err.status === 410) {
        setExpireCountdown(0);
      }

      // Reset digits on wrong code to enable clean re-entry
      if (!isLocked && err.status !== 423) {
        setDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  }, [digits, isVerifying, isLocked, isSuccess, isExpired, requestId, password, onSuccess, applicantEmail]);

  // Resend OTP action
  const handleResend = async () => {
    if (isResending || resendCooldown > 0 || resendsRemaining <= 0 || isLocked) return;

    setIsResending(true);
    setErrorMessage('');
    setStatusFeedback('');

    try {
      const result = await resendAdminRegistrationOtp({ requestId });

      // Refresh cooldowns and counters
      setResendCooldown(result.cooldownSeconds || 60);
      setExpireCountdown(result.expiresInSeconds || 600);
      setResendsRemaining(result.resendsRemaining ?? Math.max(0, resendsRemaining - 1));
      setSmsConfigured(result.smsConfigured);
      setDigits(['', '', '', '', '', '']);

      setStatusFeedback('New authorization code generated and dispatched.');
      inputsRef.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend verification code.');
      if (err.cooldownRemaining) {
        setResendCooldown(err.cooldownRemaining);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      key="admin-otp-view"
      className="admin-login-card admin-otp-card"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          /* ========================================================
             SUCCESS STATE: Administrator Access Provisioned
             ======================================================== */
          <motion.div
            key="otp-success-state"
            className="otp-success-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="otp-success-emblem">
              <div className="success-emblem-ring" />
              <div className="success-emblem-inner">
                <IconCheck className="w-8 h-8 text-emerald" />
              </div>
            </div>

            <div className="otp-success-pill">
              <span className="live-dot" />
              <span>CLEARANCE GRANTED</span>
            </div>

            <h2 className="otp-success-title">Administrator Activated</h2>
            <p className="otp-success-subtitle">
              Founder verification verified. Administrative profile provisioned with <strong>role: admin</strong> under PostgreSQL security policies.
            </p>

            <div className="otp-success-summary-box">
              <div className="summary-row">
                <span className="summary-label">Operator</span>
                <span className="summary-val">{applicantName || 'CampusNest Admin'}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Access Email</span>
                <span className="summary-val">{applicantEmail}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Privilege Tier</span>
                <span className="summary-val badge-indigo">Super Administrator</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-admin-submit"
              onClick={() => onSuccess?.({ email: applicantEmail })}
            >
              <span>Proceed to Admin Gateway</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          /* ========================================================
             INPUT STATE: 6-Digit Verification Form
             ======================================================== */
          <div key="otp-input-section" className="otp-input-section">
            {/* Header */}
            <div className="card-header-section">
              <div className="admin-icon-emblem">
                <div className="emblem-inner">
                  <IconShield className="w-6 h-6 text-indigo" />
                </div>
                <div className="emblem-ring" />
              </div>

              <div className="admin-badge-pill">
                <IconLock className="w-3.5 h-3.5 text-indigo" />
                <span>FOUNDER VERIFICATION GATEWAY</span>
              </div>

              <h1 className="admin-card-title">Founder Clearance Verification</h1>
              <p className="admin-card-subtitle">
                Verification code sent to the founder&apos;s registered number. Enter the 6-digit clearance code to authorize administrator onboarding.
              </p>
            </div>

            {/* Provider Configuration Warning (if SMS provider not configured) */}
            {!smsConfigured && (
              <motion.div
                className="admin-security-alert notice sandbox-alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <IconAlertTriangle className="w-4 h-4 alert-icon text-amber" />
                <div className="sandbox-alert-text">
                  <strong>SMS provider configuration required:</strong> Real-time SMS dispatch is paused because Twilio credentials are not yet configured in the backend environment. Ready for gateway connection.
                </div>
              </motion.div>
            )}

            {/* Dynamic Status Feedback */}
            {statusFeedback && (
              <motion.div
                className="admin-security-alert success"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <IconCheck className="w-4 h-4 alert-icon" />
                <span>{statusFeedback}</span>
              </motion.div>
            )}

            {/* Error Feedback */}
            {errorMessage && (
              <motion.div
                className="admin-security-alert error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <IconLock className="w-4 h-4 alert-icon" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* 6-Digit Pin Input Grid */}
            <form onSubmit={handleVerify} className="admin-form otp-form">
              <div className="otp-digit-grid" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={`otp-box-${idx}`}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? 'is-filled' : ''} ${isLocked || isExpired ? 'is-disabled' : ''}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying || isLocked}
                    aria-label={`Digit ${idx + 1} of verification code`}
                  />
                ))}
              </div>

              {/* Status Metadata Indicators */}
              <div className="otp-meta-row">
                <div className="meta-item">
                  <IconClock className="w-3.5 h-3.5 text-muted" />
                  <span className={expireCountdown < 60 ? 'text-rose font-mono' : 'font-mono'}>
                    Expires in {formatTime(expireCountdown)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className={`attempt-dot ${remainingAttempts <= 1 ? 'dot-danger' : ''}`} />
                  <span>
                    {isLocked ? (
                      <strong className="text-rose">Request Locked</strong>
                    ) : (
                      `${remainingAttempts} of 3 attempts remaining`
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className={`btn-admin-submit ${isVerifying ? 'is-loading' : ''}`}
                disabled={isVerifying || isLocked || isExpired || digits.join('').length !== 6}
              >
                {isVerifying ? (
                  <>
                    <IconSpinner className="w-4 h-4 animate-spin" />
                    <span>Verifying Founder Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Provision Administrator</span>
                    <IconArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend & Cooldown Controls */}
              <div className="otp-resend-container">
                <button
                  type="button"
                  className="btn-otp-resend"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0 || resendsRemaining <= 0 || isLocked}
                >
                  {isResending ? (
                    <>
                      <IconSpinner className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating New Code...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <IconRefreshCw className="w-3.5 h-3.5 text-muted" />
                      <span>Resend code in {resendCooldown}s</span>
                    </>
                  ) : resendsRemaining > 0 ? (
                    <>
                      <IconRefreshCw className="w-3.5 h-3.5" />
                      <span>Resend Founder OTP</span>
                    </>
                  ) : (
                    <span>Max resends reached</span>
                  )}
                </button>

                <span className="resends-badge">
                  {resendsRemaining} of 3 resends left
                </span>
              </div>

              {/* Back / Cancel Button */}
              <div className="otp-cancel-row">
                <button
                  type="button"
                  className="btn-otp-cancel"
                  onClick={onCancel}
                  disabled={isVerifying}
                >
                  ← Cancel &amp; Return to Registration
                </button>
              </div>
            </form>

            {/* Footer Security Notice */}
            <div className="admin-card-footer">
              <div className="security-notice-row">
                <IconShield className="w-3.5 h-3.5 text-emerald" />
                <span>Zero Plaintext Storage • HMAC-SHA256 Multi-Factor Clearance</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
