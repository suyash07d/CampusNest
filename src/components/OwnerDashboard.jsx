import { useAuth } from '../context/AuthContext';
import { 
  IconBuilding, 
  IconShield, 
  IconUsers, 
  IconArrowRight, 
  IconLogOut 
} from './Icons';
import './OwnerDashboard.css';

export default function OwnerDashboard({ onGoToHome }) {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'PG Host';
  const displayEmail = user?.email || profile?.email || '';

  return (
    <div className="dashboard-container container">
      {/* Header Banner */}
      <div className="dashboard-header-card owner-header-accent">
        <div className="dashboard-role-badge badge-owner">
          <IconBuilding className="w-4 h-4 text-accent" />
          <span>PG Owner Portal</span>
        </div>

        <div className="dashboard-title-row">
          <div>
            <h1 className="dashboard-title">Owner Dashboard</h1>
            <p className="dashboard-welcome">Welcome to CampusNest Owner Portal, <strong>{displayName}</strong>!</p>
          </div>
          <button 
            type="button" 
            className="btn-dash-logout"
            onClick={signOut}
            title="Log out of your account"
          >
            <IconLogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>

        <div className="dashboard-meta-chips">
          <span className="meta-chip">📧 {displayEmail}</span>
          <span className="meta-chip">🏢 Host Status: Ready for 2026 Academic Season</span>
          <span className="meta-chip status-active">✓ Host Registered</span>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="dash-grid">
        {/* Card 1: My Properties */}
        <div className="dash-card">
          <div className="dash-card-icon bg-amber-subtle">
            <IconBuilding className="w-6 h-6 text-amber" />
          </div>
          <h3>Your PG Accommodations</h3>
          <p>Manage your student properties, room configurations, rents, and amenity packages.</p>
          <div className="dash-status-pill">
            <span>0 active properties listed</span>
          </div>
        </div>

        {/* Card 2: Student Inquiries */}
        <div className="dash-card">
          <div className="dash-card-icon bg-indigo-subtle">
            <IconUsers className="w-6 h-6 text-indigo" />
          </div>
          <h3>Student Enquiries & Leads</h3>
          <p>Receive visit requests and booking inquiries from students admitted to colleges near your property.</p>
          <div className="dash-status-pill">
            <span>0 pending student requests</span>
          </div>
        </div>

        {/* Card 3: Verification & Campus Proximity */}
        <div className="dash-card">
          <div className="dash-card-icon bg-emerald-subtle">
            <IconShield className="w-6 h-6 text-emerald" />
          </div>
          <h3>Campus Verification Status</h3>
          <p>Gate walking distances are verified by CampusNest to ensure honest discovery for students.</p>
          <button 
            type="button" 
            className="dash-action-btn secondary"
            onClick={onGoToHome}
          >
            <span>View CampusNest Homepage</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="dash-phase-note">
        <strong>Phase 2 Authentication Active:</strong> PG Owner session is authenticated via Supabase. 
        Property listing creation, photo uploads, and room management will be introduced in Phase 3.
      </div>
    </div>
  );
}
