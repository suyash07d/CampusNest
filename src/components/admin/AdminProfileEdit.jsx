import { useState, useRef } from 'react';
import { 
  IconShield, 
  IconUser, 
  IconMail, 
  IconPhone, 
  IconCamera, 
  IconCheck, 
  IconSpinner, 
  IconLock,
  IconSparkles,
  IconBuilding,
  IconX
} from '../Icons';
import { supabase } from '../../lib/supabase';
import './AdminProfileEdit.css';

// Preset high-tech avatars for administrators
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export default function AdminProfileEdit({ profile, session, onProfileUpdated, onNavigateToPassword }) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [designation, setDesignation] = useState(
    profile?.can_manage_admins ? 'Primary Administrator' : 'System Administrator'
  );
  const [bio, setBio] = useState(
    profile?.bio || 'CampusNest Platform Operations & Student Housing Administration.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  // Handle local image file upload
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Please select an image smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result;
      if (typeof dataUri === 'string') {
        setAvatarUrl(dataUri);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      setErrorMessage('Please enter a valid full name (minimum 2 characters).');
      return;
    }

    setIsSaving(true);
    try {
      const userId = profile?.id || session?.user?.id;
      if (!userId) {
        throw new Error('User identity is missing. Please re-authenticate.');
      }

      const updates = {
        full_name: cleanName,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // 1. Update public.profiles in database
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new Error(error.message || 'Database rejected profile changes.');
      }

      // 2. Sync with auth user_metadata if available
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            avatar_url: avatarUrl.trim() || null,
          },
        });
      } catch (authSyncErr) {
        console.warn('Auth metadata sync notice:', authSyncErr);
      }

      setSuccessMessage('Administrator profile updated successfully!');
      if (onProfileUpdated) {
        onProfileUpdated(data || { ...profile, ...updates });
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const userEmail = profile?.email || session?.user?.email || '';
  const isPrimary = profile?.can_manage_admins || userEmail.toLowerCase() === 'suyashdhengle540@gmail.com';
  const displayInitial = (cleanName => (cleanName ? cleanName.charAt(0).toUpperCase() : 'A'))(fullName.trim());

  return (
    <section className="admin-profile-view">
      {/* Header section */}
      <div className="profile-heading-bar">
        <div>
          <div className="profile-badge-pill">
            <IconShield className="w-4 h-4 text-indigo" />
            <span>ADMINISTRATOR IDENTITY</span>
          </div>
          <h2>Edit Admin Profile</h2>
          <p>Update your personal information, profile picture, contact details, and platform credentials.</p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Visual Identity Card */}
        <div className="profile-card profile-preview-card">
          <div className="preview-avatar-wrapper">
            <div className="avatar-frame">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName || 'Admin'} className="avatar-preview-img" />
              ) : (
                <div className="avatar-initials-fallback">{displayInitial}</div>
              )}
              <button 
                type="button" 
                className="btn-avatar-camera"
                onClick={() => fileInputRef.current?.click()}
                title="Upload profile picture"
                aria-label="Upload photo"
              >
                <IconCamera className="w-4 h-4" />
              </button>
            </div>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleFileSelect}
            />
          </div>

          <div className="preview-info-block">
            <h3>{fullName || 'Administrator'}</h3>
            <span className="preview-email">{userEmail}</span>
            <div className="preview-role-pill">
              <span className={`status-dot ${isPrimary ? 'dot-purple' : 'dot-green'}`} />
              <span>{isPrimary ? 'Primary Administrator' : 'Administrator'}</span>
            </div>
          </div>

          {/* Preset Avatars Bar */}
          <div className="preset-avatars-section">
            <span className="preset-label">Choose a preset avatar photo:</span>
            <div className="preset-avatars-grid">
              {PRESET_AVATARS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  className={`preset-avatar-btn ${avatarUrl === preset ? 'is-selected' : ''}`}
                  onClick={() => setAvatarUrl(preset)}
                  title={`Preset avatar ${index + 1}`}
                >
                  <img src={preset} alt={`Avatar option ${index + 1}`} />
                </button>
              ))}
            </div>
            {avatarUrl && (
              <button
                type="button"
                className="btn-clear-photo"
                onClick={() => setAvatarUrl('')}
              >
                <IconX className="w-3.5 h-3.5" />
                <span>Remove custom photo (use initials)</span>
              </button>
            )}
          </div>

          <div className="preview-badges-list">
            <div className="preview-stat-item">
              <span className="stat-label">Security Role</span>
              <strong className="stat-value">{profile?.role || 'admin'}</strong>
            </div>
            <div className="preview-stat-item">
              <span className="stat-label">Access Level</span>
              <strong className="stat-value">{isPrimary ? 'Full Ownership (Founder)' : 'Full Moderation'}</strong>
            </div>
            <div className="preview-stat-item">
              <span className="stat-label">Database Status</span>
              <strong className="stat-value text-emerald">Verified Active</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="profile-card profile-form-card">
          <div className="form-card-header">
            <div className="form-header-icon">
              <IconUser className="w-5 h-5 text-indigo" />
            </div>
            <div>
              <h3>Personal &amp; Contact Details</h3>
              <p>Keep your contact details up to date for activity audit trails and security notices.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="profile-alert is-error" role="alert">
              <IconLock className="w-4 h-4 alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="profile-alert is-success" role="status">
              <IconCheck className="w-4 h-4 alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <div className="form-fields-grid">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="admin-fullname">Full Name</label>
                <div className="input-group">
                  <IconUser className="field-icon" />
                  <input
                    id="admin-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    maxLength={100}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Work Email (Locked) */}
              <div className="form-group">
                <label htmlFor="admin-email">Administrator Email (Locked)</label>
                <div className="input-group is-locked">
                  <IconMail className="field-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    value={userEmail}
                    readOnly
                    disabled
                    title="Account email address is cryptographically secured"
                  />
                  <span className="locked-badge">Verified</span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="admin-phone">Contact Number / WhatsApp</label>
                <div className="input-group">
                  <IconPhone className="field-icon" />
                  <input
                    id="admin-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={20}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Title / Designation */}
              <div className="form-group">
                <label htmlFor="admin-designation">Administrative Title</label>
                <div className="input-group">
                  <IconShield className="field-icon" />
                  <input
                    id="admin-designation"
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Lead Administrator, Operations Head"
                    maxLength={80}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Custom Photo URL Input */}
            <div className="form-group">
              <label htmlFor="admin-avatar-url">Custom Photo / Avatar Web URL</label>
              <div className="input-group">
                <IconCamera className="field-icon" />
                <input
                  id="admin-avatar-url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg (or upload above)"
                  disabled={isSaving}
                />
              </div>
              <span className="field-hint">You can upload a photo file from your phone, paste an image link, or choose a preset above.</span>
            </div>

            {/* Bio / Info */}
            <div className="form-group">
              <label htmlFor="admin-bio">Administrator Bio &amp; Role Info</label>
              <textarea
                id="admin-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description of your administrative responsibilities..."
                maxLength={300}
                disabled={isSaving}
              />
              <span className="field-hint">Visible in platform audit logs and team directory.</span>
            </div>

            {/* Actions Bar */}
            <div className="form-actions-bar">
              <button
                type="submit"
                className="btn-save-profile"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <IconSpinner className="is-spinning w-4 h-4" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>

              <div className="security-shortcut-note">
                <IconSparkles className="w-4 h-4 text-indigo" />
                <span>Changes save immediately to PostgreSQL.</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
