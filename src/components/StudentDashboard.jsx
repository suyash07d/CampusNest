import { useAuth } from '../context/AuthContext';
import { 
  IconGraduationCap, 
  IconMapPin, 
  IconHeart, 
  IconShield, 
  IconArrowRight, 
  IconLogOut 
} from './Icons';
import './StudentDashboard.css';

export default function StudentDashboard({ onBrowsePGs }) {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = user?.email || profile?.email || '';

  return (
    <div className="dashboard-container container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="dashboard-role-badge">
          <IconGraduationCap className="w-4 h-4 text-indigo" />
          <span>Student Account</span>
        </div>

        <div className="dashboard-title-row">
          <div>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-welcome">Welcome to CampusNest, <strong>{displayName}</strong>!</p>
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
          <span className="meta-chip">📍 Primary Hub: Pune / Maharashtra</span>
          <span className="meta-chip status-active">✓ Account Verified</span>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="dash-grid">
        {/* Card 1: Campus Search Anchor */}
        <div className="dash-card">
          <div className="dash-card-icon bg-indigo-subtle">
            <IconMapPin className="w-6 h-6 text-indigo" />
          </div>
          <h3>Find PGs Near Your College</h3>
          <p>Explore verified student accommodations calculated by walking minutes from your university gates.</p>
          <button 
            type="button" 
            className="dash-action-btn primary"
            onClick={onBrowsePGs}
          >
            <span>Explore Campus PGs</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Saved / Favourites */}
        <div className="dash-card">
          <div className="dash-card-icon bg-pink-subtle">
            <IconHeart className="w-6 h-6 text-pink" />
          </div>
          <h3>Saved PGs & Wishlist</h3>
          <p>Compare room rent, amenities, and food mess options side-by-side before your admission date.</p>
          <div className="dash-status-pill">
            <span>0 PGs currently saved</span>
          </div>
        </div>

        {/* Card 3: Inquiries & Visits */}
        <div className="dash-card">
          <div className="dash-card-icon bg-emerald-subtle">
            <IconShield className="w-6 h-6 text-emerald" />
          </div>
          <h3>Campus Visits & Enquiries</h3>
          <p>Track your scheduled PG tours and direct communications with verified property hosts.</p>
          <div className="dash-status-pill">
            <span>No pending visit requests</span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="dash-phase-note">
        <strong>Phase 2 Authentication Active:</strong> Student session is securely authenticated via Supabase. 
        Full enquiry tracking, real-time messaging, and interactive booking will unlock in subsequent phases.
      </div>
    </div>
  );
}
