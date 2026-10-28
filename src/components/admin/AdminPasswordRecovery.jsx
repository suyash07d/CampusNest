import { useState } from 'react';
import { motion } from 'motion/react';
import { IconArrowRight, IconLock, IconMail, IconShield, IconSpinner } from '../Icons';

export default function AdminPasswordRecovery({ mode, email, onEmailChange, onBack, onRequestReset, onUpdatePassword }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const isReset = mode === 'reset';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');

    if (!isReset && !email.trim()) {
      setErrorMessage('Enter the email address for your administrator account.');
      return;
    }
    if (isReset && password.length < 8) {
      setErrorMessage('Choose a password with at least 8 characters.');
      return;
    }
    if (isReset && password !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isReset) {
        await onUpdatePassword(password);
      } else {
        await onRequestReset(email.trim());
        setNotice('If an account is registered with that email, a password reset link will arrive shortly.');
      }
    } catch (error) {
      setErrorMessage(error?.message || 'We could not complete that request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      className="admin-login-card admin-recovery-card"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="admin-recovery-title"
    >
      <div className="card-header-section">
        <div className="admin-icon-emblem">
          <div className="emblem-inner"><IconShield className="w-6 h-6 text-indigo" /></div>
          <div className="emblem-ring" />
        </div>
        <div className="admin-badge-pill"><IconShield className="w-3.5 h-3.5 text-indigo" /><span>ACCOUNT SECURITY</span></div>
        <h1 className="admin-card-title" id="admin-recovery-title">{isReset ? 'Choose a new password' : 'Reset your password'}</h1>
        <p className="admin-card-subtitle">
          {isReset
            ? 'Set a new password for your AplaStay administrator account.'
            : 'Enter your administrator email and we’ll send a link if an account matches.'}
        </p>
      </div>

      {errorMessage && <div className="admin-security-alert error" role="alert"><IconLock className="w-4 h-4 alert-icon" /><span>{errorMessage}</span></div>}
      {notice && <div className="admin-security-alert notice" role="status"><IconMail className="w-4 h-4 alert-icon" /><span>{notice}</span></div>}

      <form onSubmit={handleSubmit} className="admin-form" noValidate>
        {isReset ? (
          <>
            <div className="admin-form-group">
              <label htmlFor="admin-new-password" className="admin-label">New password</label>
              <div className="admin-input-wrapper">
                <IconLock className="input-leading-icon" />
                <input id="admin-new-password" type="password" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={isSubmitting} />
              </div>
            </div>
            <div className="admin-form-group">
              <label htmlFor="admin-confirm-password" className="admin-label">Confirm new password</label>
              <div className="admin-input-wrapper">
                <IconLock className="input-leading-icon" />
                <input id="admin-confirm-password" type="password" className="admin-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={isSubmitting} />
              </div>
            </div>
          </>
        ) : (
          <div className="admin-form-group">
            <label htmlFor="admin-recovery-email" className="admin-label">Administrator email</label>
            <div className="admin-input-wrapper">
              <IconMail className="input-leading-icon" />
              <input id="admin-recovery-email" type="email" className="admin-input" placeholder="admin@aplastay.in" value={email} onChange={(event) => onEmailChange(event.target.value)} autoComplete="username" required disabled={isSubmitting || !!notice} />
            </div>
          </div>
        )}

        <button type="submit" className="btn-admin-submit" disabled={isSubmitting || !!notice}>
          {isSubmitting ? <><IconSpinner className="w-4 h-4 animate-spin" /><span>{isReset ? 'Updating password…' : 'Sending reset link…'}</span></> : <><span>{isReset ? 'Update password' : 'Send reset link'}</span><IconArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <button type="button" className="btn-recovery-back" onClick={onBack} disabled={isSubmitting}>Back to administrator sign in</button>
      <p className="recovery-security-note">Password reset links expire and can only be used once.</p>
    </motion.section>
  );
}
