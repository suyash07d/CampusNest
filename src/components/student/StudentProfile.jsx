import { useState } from 'react';
import { PUNE_COLLEGES } from '../../data/puneDiscoveryData';
import { 
  IconUser, 
  IconMail, 
  IconPhone, 
  IconGraduationCap, 
  IconShield, 
  IconCheck, 
  IconSpinner, 
  IconAlertTriangle
} from '../Icons';

export default function StudentProfile({
  user,
  profile,
  college,
  onUpdateProfile,
}) {
  const [fullName, setFullName] = useState(() => profile?.full_name || '');
  const [phone, setPhone] = useState(() => profile?.phone || '');
  const [selectedCollegeId, setSelectedCollegeId] = useState(() => profile?.college_id || '');
  
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          college_id: selectedCollegeId || null,
        });
        setSuccessMessage('Profile and campus preferences updated successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = user?.email || profile?.email || '';
  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="student-profile-view">
      <div className="section-title-strip">
        <div>
          <h2 className="section-heading">Student Profile & Campus Settings</h2>
          <p className="section-subheading">
            Manage your student identity and primary university campus anchor.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="profile-alert alert-success">
          <IconCheck className="w-4 h-4 text-emerald" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="profile-alert alert-error">
          <IconAlertTriangle className="w-4 h-4 text-red" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="profile-cards-grid">
        {/* Left Column: Form Card */}
        <div className="profile-form-card">
          <h3 className="card-subheading">Personal Information</h3>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="student-full-name" className="form-label">
                Full Name
              </label>
              <div className="input-with-icon">
                <IconUser className="field-icon" />
                <input
                  id="student-full-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="form-group">
              <label htmlFor="student-email" className="form-label">
                Email Address <span className="label-badge">Authenticated</span>
              </label>
              <div className="input-with-icon">
                <IconMail className="field-icon" />
                <input
                  id="student-email"
                  type="email"
                  className="form-input is-readonly"
                  value={displayEmail}
                  readOnly
                  disabled
                />
              </div>
              <span className="field-hint">
                Linked to your Supabase login credentials.
              </span>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="student-phone" className="form-label">
                Mobile / WhatsApp Number <span className="label-badge optional">Optional</span>
              </label>
              <div className="input-with-icon">
                <IconPhone className="field-icon" />
                <input
                  id="student-phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210 (for visit confirmations)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <span className="field-hint">
                Only shared with property hosts when you request an in-person room visit.
              </span>
            </div>

            {/* College Anchor Selector */}
            <div className="form-group">
              <label htmlFor="student-college" className="form-label">
                Primary College / University Anchor
              </label>
              <div className="input-with-icon">
                <IconGraduationCap className="field-icon" />
                <select
                  id="student-college"
                  className="form-select"
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                >
                  <option value="">-- Select Your College in Pune --</option>
                  {PUNE_COLLEGES.map((c) => (
                    <option key={c.id || c.slug} value={c.id || c.slug}>
                      {c.shortName} — {c.name} ({c.areaSlug})
                    </option>
                  ))}
                </select>
              </div>
              <span className="field-hint">
                Calculates walking times and lists closest PGs in order of proximity to campus.
              </span>
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                className="btn-profile-submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <IconSpinner className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Account Status & Trust */}
        <div className="profile-status-column">
          {/* Status Card */}
          <div className="profile-identity-card">
            <div className="identity-avatar-box">
              {(displayName[0] || 'S').toUpperCase()}
            </div>
            <h3 className="identity-name">{displayName}</h3>
            <span className="identity-role">🎓 Student Account</span>

            <div className="identity-badges">
              {isVerified ? (
                <span className="badge-pill is-verified">
                  <IconCheck className="w-3.5 h-3.5 text-emerald" />
                  <span>Account Verified</span>
                </span>
              ) : (
                <span className="badge-pill is-active">
                  <IconShield className="w-3.5 h-3.5 text-indigo" />
                  <span>Standard Student</span>
                </span>
              )}
            </div>

            <div className="identity-meta-list">
              <div className="identity-meta-item">
                <span className="meta-k">Location:</span>
                <span className="meta-v">Pune, Maharashtra</span>
              </div>
              <div className="identity-meta-item">
                <span className="meta-k">Current Anchor:</span>
                <span className="meta-v">
                  {college ? `${college.shortName} (${college.areaName || college.areaSlug})` : 'Not Selected'}
                </span>
              </div>
              <div className="identity-meta-item">
                <span className="meta-k">Member Since:</span>
                <span className="meta-v">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Box */}
          <div className="profile-privacy-box">
            <div className="privacy-header">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>CampusNest Privacy Standard</span>
            </div>
            <p className="privacy-text">
              We never disclose passwords, security tokens, or personal phone numbers to unauthorized brokers. 
              Communication is strictly limited to verified PG hosts for legitimate visit scheduling.
            </p>
            <div className="privacy-tags">
              <span>🔒 RLS Encrypted</span>
              <span>🚫 Zero Spam</span>
              <span>🎓 100% Student-First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
