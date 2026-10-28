import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  IconBuilding, 
  IconShield, 
  IconUsers, 
  IconArrowRight, 
  IconCheck, 
  IconMapPin, 
  IconSparkles,
  IconLock
} from './Icons';
import './OwnerPortalHero.css';

export default function OwnerPortalHero({ onOpenLogin, onOpenRegister, onOpenOwnerModal }) {
  const [fastSubmitName, setFastSubmitName] = useState('');
  const [fastSubmitPhone, setFastSubmitPhone] = useState('');
  const [fastSubmitCollege, setFastSubmitCollege] = useState('COEP Tech, Shivajinagar');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFastSubmit = (e) => {
    e.preventDefault();
    if (!fastSubmitName || !fastSubmitPhone) return;
    setIsSuccess(true);
  };

  return (
    <div className="owner-portal-root">
      {/* Ambient Cosmic Background */}
      <div className="portal-glow-orb glow-violet" aria-hidden="true" />
      <div className="portal-glow-orb glow-cyan" aria-hidden="true" />
      <div className="portal-grid-pattern" aria-hidden="true" />

      <div className="container portal-hero-container">
        
        {/* Top Header Badge */}
        <div className="portal-badge-pill">
          <IconBuilding className="w-4 h-4 text-cyan" />
          <span>APLASTAY FOR PROPERTY OWNERS &amp; HOSTELS</span>
          <span className="pill-divider">•</span>
          <span className="text-cyan">Zero Brokerage 2026</span>
        </div>

        {/* Main Headline */}
        <h1 className="portal-hero-title">
          List Your Pune PG. Connect with Students Directly.{' '}
          <span className="title-accent">Zero Broker Fee.</span>
        </h1>

        <p className="portal-hero-subtitle">
          Join 280+ verified hostel and PG hosts across Pune. List your single, double, and triple sharing rooms, 
          manage student inquiries, set custom mess rates, and fill vacancies ahead of the 2026 college admissions.
        </p>

        {/* Primary Call-to-Action Bar */}
        <div className="portal-cta-group">
          <button 
            type="button" 
            className="btn-portal-primary"
            onClick={onOpenRegister}
          >
            <IconSparkles className="w-4 h-4" />
            <span>Create Host Account (Free)</span>
            <IconArrowRight className="w-4 h-4" />
          </button>

          <button 
            type="button" 
            className="btn-portal-secondary"
            onClick={onOpenLogin}
          >
            <IconLock className="w-4 h-4" />
            <span>Sign In to Owner Dashboard</span>
          </button>
        </div>

        {/* 4 Pillars of Value Grid */}
        <div className="portal-pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon bg-violet">
              <IconShield className="w-5 h-5 text-violet" />
            </div>
            <h3>100% Zero Brokerage</h3>
            <p>We never charge brokerage from you or students. Your hard-earned monthly rental income is entirely yours.</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-cyan">
              <IconMapPin className="w-5 h-5 text-cyan" />
            </div>
            <h3>Campus Gate Proximity</h3>
            <p>Accurate pedestrian gate walk times (300m - 1.2km) verified by AplaStay to attract serious college admits.</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-blue">
              <IconBuilding className="w-5 h-5 text-blue" />
            </div>
            <h3>Multi-Tier Room Pricing</h3>
            <p>Set custom rents for Single Room, 2-Sharing, 3-Sharing, and 4-Sharing with optional AC and hygienic food packages.</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-emerald">
              <IconUsers className="w-5 h-5 text-emerald" />
            </div>
            <h3>Verified Student Leads</h3>
            <p>Direct inquiries from students admitted to COEP, MIT-WPU, PICT, DY Patil, Fergusson, and Symbiosis.</p>
          </div>
        </div>

        {/* Fast Pre-Listing Card */}
        <div className="portal-quicklist-card">
          <div className="quicklist-content">
            <div className="quicklist-badge">
              <span className="live-dot-pulse" />
              <span>Priority 2026 Batch Enrollment</span>
            </div>
            <h2>Quick Register Your Property in 60 Seconds</h2>
            <p>Our Pune campus verification team will review your PG details and activate your live student card within 24 hours.</p>

            {isSuccess ? (
              <div className="quicklist-success-banner">
                <IconCheck className="w-6 h-6 text-emerald" />
                <div>
                  <strong>Property Registration Received!</strong>
                  <p>Our AplaStay Pune representative will contact you at <strong>{fastSubmitPhone}</strong> to verify photos and publish your live listing.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFastSubmit} className="quicklist-form-row">
                <input 
                  type="text" 
                  className="quicklist-input" 
                  placeholder="Your PG / Hostel Name (e.g. Royal Girls PG)"
                  value={fastSubmitName}
                  onChange={(e) => setFastSubmitName(e.target.value)}
                  required 
                />
                <input 
                  type="tel" 
                  className="quicklist-input" 
                  placeholder="Owner Mobile (WhatsApp preferred)"
                  value={fastSubmitPhone}
                  onChange={(e) => setFastSubmitPhone(e.target.value)}
                  required 
                />
                <select 
                  className="quicklist-select"
                  value={fastSubmitCollege}
                  onChange={(e) => setFastSubmitCollege(e.target.value)}
                >
                  <option value="COEP Tech, Shivajinagar">Near COEP Tech, Shivajinagar</option>
                  <option value="MIT-WPU, Kothrud">Near MIT-WPU, Kothrud</option>
                  <option value="PICT, Dhankawadi">Near PICT, Dhankawadi</option>
                  <option value="Fergusson College, Deccan">Near Fergusson College, Deccan</option>
                  <option value="DY Patil, Pimpri / Akurdi">Near DY Patil, Pimpri / Akurdi</option>
                  <option value="PCCOE, Nigdi">Near PCCOE, Nigdi</option>
                  <option value="Symbiosis, Viman Nagar">Near Symbiosis, Viman Nagar</option>
                </select>
                <button type="submit" className="btn-quicklist-submit">
                  <span>Register Free</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
