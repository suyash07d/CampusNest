import { useCallback, useEffect, useState } from 'react';
import { IconCheck, IconCopy, IconMail, IconRefreshCw, IconShield, IconSparkles, IconSpinner, IconUsers } from '../Icons';
import { inviteAdministrator, listAdministrators } from '../../lib/adminManagementService';
import './AdminManagement.css';

export default function AdminManagement({ session }) {
  const [administrators, setAdministrators] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const loadAdministrators = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listAdministrators(session);
      setAdministrators(list);
    } catch (error) {
      console.warn('Could not load administrator directory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAdministrators();
  }, [loadAdministrators]);

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy notice:', err);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setErrorMessage('Enter the administrator’s full name.');
      return;
    }

    if (cleanEmail.includes('@gmailcom') || cleanEmail.includes('@yahoocom') || cleanEmail.includes('@outlookcom')) {
      setErrorMessage('Missing "." before "com". Did you mean @gmail.com?');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setErrorMessage('Enter a valid email address with a domain (e.g. name@gmail.com).');
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteAdministrator({ fullName: cleanName, email: cleanEmail }, session);
      setSuccessMessage(result.message || `Invitation ready for ${cleanEmail}.`);
      if (result.invite_link) {
        setInviteLink(result.invite_link);
      }
      setFullName('');
      setEmail('');
      await loadAdministrators();
    } catch (error) {
      setErrorMessage(error?.message || 'The invitation could not be sent.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <section className="admin-management-view">
      <div className="admin-management-heading">
        <div>
          <div className="admin-management-eyebrow"><IconShield className="w-4 h-4" /> ACCESS CONTROL</div>
          <h2>Admin access</h2>
          <p>Primary Administrator: <strong>suyashdhengle540@gmail.com</strong>. Manage teammates and secure workspace access.</p>
        </div>
        <button type="button" className="admin-management-refresh" onClick={loadAdministrators} disabled={isLoading}>
          <IconRefreshCw className={isLoading ? 'is-spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="admin-management-grid">
        <article className="admin-management-card admin-invite-card">
          <div className="admin-management-card-heading">
            <div className="admin-management-icon"><IconMail /></div>
            <div>
              <h3>Invite an administrator</h3>
              <p>They’ll receive a secure email link to set their password.</p>
            </div>
          </div>

          {errorMessage && <div className="admin-management-alert is-error" role="alert">{errorMessage}</div>}
          {successMessage && <div className="admin-management-alert is-success" role="status"><IconCheck />{successMessage}</div>}

          {inviteLink && (
            <div className="admin-invite-link-box">
              <div className="invite-link-header">
                <IconSparkles className="w-4 h-4 text-emerald" />
                <strong>Direct Setup Link Ready</strong>
              </div>
              <p className="invite-link-desc">
                Share this secure link with the administrator. When they click it, they can immediately set their password and log in:
              </p>
              <div className="invite-link-row">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="invite-link-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className={`btn-copy-link ${copied ? 'is-copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <><IconCheck className="w-4 h-4" /><span>Copied!</span></>
                  ) : (
                    <><IconCopy className="w-4 h-4" /><span>Copy link</span></>
                  )}
                </button>
              </div>
              <div className="invite-link-actions">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hello! Here is your CampusNest Administrator setup link: ${inviteLink}\nClick this link to set your password and access the admin dashboard.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-share-whatsapp"
                >
                  <span>Share via WhatsApp</span>
                </a>
                <button
                  type="button"
                  className="btn-dismiss-link"
                  onClick={() => setInviteLink('')}
                >
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          )}

          <form className="admin-invite-form" onSubmit={handleInvite}>
            <label className="admin-invite-field">
              <span>Full name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={120} required disabled={isInviting} placeholder="Administrator name" />
            </label>
            <label className="admin-invite-field">
              <span>Work email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" autoCapitalize="none" maxLength={255} required disabled={isInviting} placeholder="name@company.com" />
            </label>
            <button type="submit" className="admin-invite-submit" disabled={isInviting}>
              {isInviting ? <><IconSpinner className="is-spinning" /><span>Sending invite…</span></> : <><IconMail /><span>Send secure invitation</span></>}
            </button>
          </form>

          <div className="admin-invite-security-note">
            <IconShield />
            <span>Passwords stay private. The invitee chooses their password from the email link.</span>
          </div>
        </article>

        <article className="admin-management-card admin-directory-card">
          <div className="admin-management-card-heading directory-heading">
            <div className="admin-management-icon"><IconUsers /></div>
            <div>
              <h3>Administrator directory</h3>
              <p>{administrators.length} administrator{administrators.length === 1 ? '' : 's'} in this workspace</p>
            </div>
          </div>

          {isLoading ? (
            <div className="admin-directory-state"><IconSpinner className="is-spinning" /><span>Loading administrators…</span></div>
          ) : administrators.length === 0 ? (
            <div className="admin-directory-state">No administrator accounts were found.</div>
          ) : (
            <ul className="admin-directory-list">
              {administrators.map((admin) => (
                <li key={admin.id} className="admin-directory-item">
                  <div className="admin-directory-avatar">{(admin.full_name || admin.email || 'A').trim().charAt(0).toUpperCase()}</div>
                  <div className="admin-directory-identity">
                    <strong>{admin.full_name || 'CampusNest administrator'}</strong>
                    <span>{admin.email}</span>
                  </div>
                  <span className={`admin-directory-status ${admin.status === 'Primary Administrator' ? 'is-primary-admin' : admin.status === 'Active' ? 'is-active' : 'is-pending'}`}>
                    {admin.status || 'Administrator'}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="admin-directory-footnote">Invitations assign the administrator role after server-side authorization.</p>
        </article>
      </div>
    </section>
  );
}
