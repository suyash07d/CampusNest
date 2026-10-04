import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  IconX, 
  IconMapPin, 
  IconStar, 
  IconCheck, 
  IconShield, 
  IconGraduationCap, 
  IconSparkles 
} from './Icons';
import './PGDetailModal.css';

export default function PGDetailModal({ pg, onClose }) {
  const [activeSharing, setActiveSharing] = useState(pg.sharingTypes[0]);
  const [visitBooked, setVisitBooked] = useState(false);
  const [studentPhone, setStudentPhone] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!pg) return null;

  const handleBookVisit = (e) => {
    e.preventDefault();
    setVisitBooked(true);
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="pg-detail-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-pg-title"
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <IconX className="w-5 h-5" />
        </button>

        {/* Modal Header Media */}
        <div className="modal-hero-media">
          <img src={pg.heroImage} alt={pg.name} className="modal-cover-img" />
          <div className="modal-media-overlay" />
          <div className="modal-media-badge-group">
            <span className="modal-pill modal-pill-gender">{pg.gender}</span>
            <span className="modal-pill modal-pill-match">{pg.matchPercentage}% Match</span>
          </div>
          <div className="modal-media-distance">
            <IconMapPin className="w-4 h-4 text-emerald" />
            <span>{pg.distance} ({pg.walkingTime}) from {pg.targetCollege}</span>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="modal-body-scroll">
          <div className="modal-top-info">
            <div className="info-main">
              <span className="modal-college-tag">
                <IconGraduationCap className="w-3.5 h-3.5" />
                <span>Partner Campus: {pg.targetCollege}</span>
              </span>
              <h2 id="modal-pg-title" className="modal-title">{pg.name}</h2>
              <p className="modal-location">{pg.area}</p>
            </div>

            <div className="info-rating-stack">
              <div className="modal-star-row">
                <IconStar className="w-5 h-5 text-amber fill-current" />
                <span className="modal-rating-num">{pg.rating}</span>
              </div>
              <span className="modal-reviews-cnt">{pg.reviewsCount} student reviews</span>
            </div>
          </div>

          {/* Pricing & Sharing Selector */}
          <div className="modal-section sharing-pricing-section">
            <h4 className="section-label">Select Sharing Option:</h4>
            <div className="sharing-selector-grid">
              {pg.sharingTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`sharing-card-btn ${activeSharing === type ? 'is-selected' : ''}`}
                  onClick={() => setActiveSharing(type)}
                >
                  <span className="sharing-type-name">{type}</span>
                  <span className="sharing-price-text">₹{pg.rent}/mo</span>
                  {activeSharing === type && <IconCheck className="sharing-check-icon" />}
                </button>
              ))}
            </div>
          </div>

          {/* Room Description */}
          <div className="modal-section">
            <h4 className="section-label">Room & Living Overview:</h4>
            <p className="modal-overview-text">{pg.roomOverview}</p>
          </div>

          {/* Amenities Grid */}
          <div className="modal-section">
            <h4 className="section-label">Included Amenities & Services:</h4>
            <div className="modal-amenities-grid">
              {pg.amenities.map((item, idx) => (
                <div key={idx} className="modal-amenity-cell">
                  <div className="amenity-check-box">
                    <IconCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules & Policies */}
          <div className="modal-section rules-section">
            <h4 className="section-label">Safety & House Guidelines:</h4>
            <ul className="modal-rules-list">
              {pg.rules.map((rule, idx) => (
                <li key={idx} className="rule-item">
                  <IconShield className="rule-icon" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Campus Visit Scheduler */}
          <div className="modal-visit-action-card">
            {!visitBooked ? (
              <form onSubmit={handleBookVisit} className="visit-form">
                <div className="visit-text">
                  <h5>Schedule a Free Campus Visit</h5>
                  <p>Check out the room and mess food before making your admission decision.</p>
                </div>
                <div className="visit-input-row">
                  <input
                    type="tel"
                    placeholder="Enter student WhatsApp number"
                    className="visit-input"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-visit-submit">
                    Request Visit Slot
                  </button>
                </div>
              </form>
            ) : (
              <div className="visit-success-box">
                <div className="success-icon-badge">✓</div>
                <div>
                  <h5>Visit Slot Reserved!</h5>
                  <p>Our student coordinator will share directions and campus contact pass over WhatsApp.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="modal-sticky-footer">
          <div className="footer-price-col">
            <span className="price-label">Starting Rent</span>
            <div className="price-big">
              <span className="curr">₹</span>
              <span className="val">{pg.rent}</span>
              <span className="period">/month</span>
            </div>
            <span className="brokerage-badge">Zero Brokerage Guaranteed</span>
          </div>

          <button 
            type="button" 
            className="btn-reserve-preview"
            onClick={() => {
              alert(`Reserve Interest registered for ${pg.name} (${activeSharing}). In the full platform, this locks your room preview!`);
              onClose();
            }}
          >
            <IconSparkles className="w-4 h-4" />
            <span>Express Room Interest</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
