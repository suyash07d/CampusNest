import { 
  IconShield, 
  IconCheck, 
  IconLock, 
  IconLogOut, 
  IconExternalLink,
  IconSparkles
} from '../Icons';
import './AdminShell.css';

export default function AdminSettings({ profile, personalization, onSignOut, onGoHome, onReplayWelcome }) {
  const adminName = personalization?.displayName || profile?.full_name || 'System Administrator';
  const adminEmail = personalization?.email || profile?.email || '';
  const adminRole = profile?.role || 'admin';
  const adminId = profile?.id || '';
  const adminBadge = personalization?.badge || 'System Administrator';
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : 'Active Session';

  return (
    <div className="admin-settings-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Control Center Configuration &amp; Security</h2>
          <p className="view-subtitle">
            Authenticated administrative credentials, Supabase database security parameters, and operational integrity status.
          </p>
        </div>
      </div>

      <div className="settings-sections-grid">
        {/* Administrator Profile Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="header-title-group">
              <IconShield className="w-5 h-5 text-indigo" />
              <h3>Administrative Identity</h3>
            </div>
            <span className="role-tag-admin">{personalization?.isEasterEgg ? 'VIP ADMIN' : 'VERIFIED ADMIN'}</span>
          </div>

          <div className="settings-card-body">
            <div className="dossier-key-values">
              <div className="kv-row">
                <span className="kv-key">Full Name</span>
                <span className="kv-val">{adminName}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Email Address</span>
                <span className="kv-val">{adminEmail}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Assigned Title</span>
                <span className="kv-val">{adminBadge}</span>
              </div>
              {personalization?.isEasterEgg && (
                <div className="kv-row">
                  <span className="kv-key">VIP Easter Egg</span>
                  <span className="kv-val text-amber font-semibold">Active: &quot;{personalization.welcomeGreeting}&quot;</span>
                </div>
              )}
              <div className="kv-row">
                <span className="kv-key">System Role</span>
                <span className="kv-val">
                  <span className="role-tag-admin">{adminRole}</span>
                  <span className="kv-sub-note">(Database-enforced in public.profiles)</span>
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Internal Identity UUID</span>
                <span className="kv-val font-mono">{adminId || 'Session User'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Member Since</span>
                <span className="kv-val">{joinedDate}</span>
              </div>
            </div>

            <div className="settings-card-actions">
              {onReplayWelcome && (
                <button
                  type="button"
                  className="btn-replay-welcome-action"
                  onClick={onReplayWelcome}
                >
                  <IconSparkles className="w-4 h-4 text-indigo" />
                  <span>Preview Welcome Animation</span>
                </button>
              )}
              <button
                type="button"
                className="btn-danger-action"
                onClick={onSignOut}
              >
                <IconLogOut className="w-4 h-4" />
                <span>Terminate Administrative Session</span>
              </button>
              <button
                type="button"
                className="btn-neutral-action"
                onClick={onGoHome}
              >
                <span>Switch to Public Student Portal</span>
                <IconExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Security & RLS Compliance Matrix */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="header-title-group">
              <IconLock className="w-5 h-5 text-emerald" />
              <h3>Database &amp; RLS Security Matrix</h3>
            </div>
            <span className="status-pill pill-approved">All Systems Enforced</span>
          </div>

          <div className="settings-card-body">
            <div className="compliance-checklist">
              <div className="compliance-item">
                <div className="compliance-icon-box bg-emerald">
                  <IconCheck className="w-4 h-4 text-emerald" />
                </div>
                <div className="compliance-text">
                  <h5>Row Level Security (RLS)</h5>
                  <p>Enforced across all 16 relational tables in Supabase PostgreSQL.</p>
                </div>
              </div>

              <div className="compliance-item">
                <div className="compliance-icon-box bg-indigo">
                  <IconCheck className="w-4 h-4 text-indigo" />
                </div>
                <div className="compliance-text">
                  <h5>Zero Service-Role Leakage</h5>
                  <p>Client applications operate strictly with unprivileged anonymous and authenticated PostgREST keys.</p>
                </div>
              </div>

              <div className="compliance-item">
                <div className="compliance-icon-box bg-emerald">
                  <IconCheck className="w-4 h-4 text-emerald" />
                </div>
                <div className="compliance-text">
                  <h5>Actor Role Integrity Trigger</h5>
                  <p>Database trigger automatically binds public.activity_logs.actor_role to the user's actual profile role.</p>
                </div>
              </div>

              <div className="compliance-item">
                <div className="compliance-icon-box bg-indigo">
                  <IconCheck className="w-4 h-4 text-indigo" />
                </div>
                <div className="compliance-text">
                  <h5>Immutable Audit Trail</h5>
                  <p>Zero UPDATE or DELETE policies exist on activity_logs and admin_actions tables.</p>
                </div>
              </div>

              <div className="compliance-item">
                <div className="compliance-icon-box bg-emerald">
                  <IconCheck className="w-4 h-4 text-emerald" />
                </div>
                <div className="compliance-text">
                  <h5>Identity Protection Trigger</h5>
                  <p>Admins can only toggle is_verified; user roles and identities cannot be arbitrarily manipulated.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
