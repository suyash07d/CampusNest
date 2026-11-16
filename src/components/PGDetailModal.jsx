import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  IconX, 
  IconMapPin, 
  IconStar, 
  IconCheck, 
  IconShield, 
  IconGraduationCap, 
  IconSparkles,
  IconWhatsApp,
  IconPhone,
  IconArrowRight,
  IconHeart
} from './Icons';
import './PGDetailModal.css';

// Default host contact for live WhatsApp demo (Pune Host Line)
const HOST_WHATSAPP_NUMBER = '919822012345';

export default function PGDetailModal({ pg, onClose }) {
  const [activeSharing, setActiveSharing] = useState(pg?.sharingTypes ? pg.sharingTypes[0] : 'Triple Sharing');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [visitSlot, setVisitSlot] = useState('Tomorrow Morning (10:00 AM - 1:00 PM)');
  const [visitBooked, setVisitBooked] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== 'undefined' && pg?.id) {
      try {
        const saved = JSON.parse(localStorage.getItem('aplastay_saved_pgs') || '[]');
        return saved.includes(pg.id);
      } catch (e) { /* ignore */ }
    }
    return false;
  });

  const handleToggleSave = () => {
    if (!pg?.id) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (typeof window !== 'undefined') {
      try {
        const savedIds = JSON.parse(localStorage.getItem('aplastay_saved_pgs') || '[]');
        const updatedIds = nextSaved
          ? [...savedIds.filter(id => id !== pg.id), pg.id]
          : savedIds.filter(id => id !== pg.id);
        localStorage.setItem('aplastay_saved_pgs', JSON.stringify(updatedIds));

        const savedObjs = JSON.parse(localStorage.getItem('aplastay_saved_pg_objects') || '[]');
        const updatedObjs = nextSaved
          ? [pg, ...savedObjs.filter(o => o.id !== pg.id)]
          : savedObjs.filter(o => o.id !== pg.id);
        localStorage.setItem('aplastay_saved_pg_objects', JSON.stringify(updatedObjs));

        window.dispatchEvent(new CustomEvent('aplastay:saved_changed', { detail: updatedIds }));
      } catch (e) { /* ignore */ }
    }
  };

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

  // Calculate pricing modifier based on sharing tier
  const calculateTierPrice = (sharingType) => {
    const base = parseInt(pg.rent.replace(/,/g, '')) || 7500;
    if (sharingType.toLowerCase().includes('single')) return (base + 3800).toLocaleString('en-IN');
    if (sharingType.toLowerCase().includes('double')) return (base + 1200).toLocaleString('en-IN');
    return pg.rent;
  };

  const currentPrice = calculateTierPrice(activeSharing);

  // Form Submission: Registers lead directly into the Owner's dashboard
  const handleBookVisit = (e) => {
    e.preventDefault();
    setPhoneError('');

    const cleanPhone = studentPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const ref = 'AS-' + Math.floor(1000 + Math.random() * 9000);
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91 ${cleanPhone.slice(-10)}`;

    const newLead = {
      id: `lead_${Date.now()}`,
      refId: ref,
      studentName: studentName.trim() || 'Prospective Fresher',
      college: pg.targetCollege,
      sharing: activeSharing,
      pgName: pg.name,
      pgArea: pg.area,
      rent: currentPrice,
      date: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'Pending Review',
      phone: formattedPhone,
      slot: visitSlot,
      isNew: true
    };

    // 1. Save to owner's leads registry in localStorage
    if (typeof window !== 'undefined') {
      try {
        const existingLeads = JSON.parse(localStorage.getItem('aplastay_owner_leads') || '[]');
        const updated = [newLead, ...existingLeads.filter(l => l.id !== newLead.id)];
        localStorage.setItem('aplastay_owner_leads', JSON.stringify(updated));

        // 2. Also save to student's my inquiries list
        const existingMyInquiries = JSON.parse(localStorage.getItem('aplastay_my_inquiries') || '[]');
        localStorage.setItem('aplastay_my_inquiries', JSON.stringify([newLead, ...existingMyInquiries]));

        // 3. Dispatch real-time event across app
        window.dispatchEvent(new CustomEvent('aplastay:new_inquiry', { detail: newLead }));

        // 4. Cloud sync to Supabase public.enquiries table
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pg.id);
        if (isUuid) {
          supabase.from('enquiries').insert({
            pg_id: pg.id,
            room_type_preference: activeSharing,
            visit_date: visitSlot,
            message: `Student: ${studentName.trim()} • Phone: ${formattedPhone} • Ref: ${ref}`
          }).then(({ error }) => {
            if (error) console.warn('Supabase enquiry insert note:', error.message);
          });
        }
      } catch (err) {
        console.error('Failed to store inquiry:', err);
      }
    }

    setBookingRef(ref);
    setVisitBooked(true);
  };

  // Pre-formatted WhatsApp Message for direct host chat
  const whatsAppMessage = encodeURIComponent(
    `Hi! I found ${pg.name} on AplaStay and I'm interested in the ${activeSharing} room (₹${currentPrice}/mo) near ${pg.targetCollege}.\n\nMy name is ${studentName.trim() || 'a student'} and I would like to schedule a campus visit for: ${visitSlot}.\nCould you please share directions and visitor entry details?`
  );

  const whatsAppLink = `https://wa.me/${HOST_WHATSAPP_NUMBER}?text=${whatsAppMessage}`;

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
        {/* Modal Top Actions */}
        <div className="modal-top-actions">
          <button 
            type="button" 
            className={`modal-heart-btn ${isSaved ? 'heart-active' : ''}`}
            onClick={handleToggleSave}
            title={isSaved ? 'Saved in Shortlist' : 'Save to Shortlist'}
            aria-label={isSaved ? 'Saved in Shortlist' : 'Save to Shortlist'}
          >
            <IconHeart className={`w-4 h-4 ${isSaved ? 'fill-current text-pink' : ''}`} />
          </button>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header Media */}
        <div className="modal-hero-media">
          <img src={pg.heroImage} alt={pg.name} className="modal-cover-img" />
          <div className="modal-media-overlay" />
          <div className="modal-media-badge-group">
            <span className="modal-pill modal-pill-gender">{pg.gender}</span>
            <span className="modal-pill modal-pill-match">{pg.matchPercentage}% Match</span>
            <span className="modal-pill modal-pill-zero">0% Brokerage</span>
          </div>
          <div className="modal-media-distance">
            <IconMapPin className="w-4 h-4 text-emerald" />
            <span><strong>{pg.distance}</strong> ({pg.walkingTime}) from {pg.targetCollege}</span>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="modal-body-scroll">
          <div className="modal-top-info">
            <div className="info-main">
              <span className="modal-college-tag">
                <IconGraduationCap className="w-3.5 h-3.5" />
                <span>Anchored Campus: {pg.targetCollege}</span>
              </span>
              <h2 id="modal-pg-title" className="modal-title">{pg.name}</h2>
              <p className="modal-location">📍 {pg.area}</p>
            </div>

            <div className="info-rating-stack">
              <div className="modal-star-row">
                <IconStar className="w-5 h-5 text-amber fill-current" />
                <span className="modal-rating-num">{pg.rating}</span>
              </div>
              <span className="modal-reviews-cnt">{pg.reviewsCount} verified student reviews</span>
            </div>
          </div>

          {/* Pricing & Sharing Selector */}
          <div className="modal-section sharing-pricing-section">
            <div className="section-header-split">
              <h4 className="section-label">Select Sharing Option:</h4>
              <span className="sharing-hint">Tap option to update monthly pricing</span>
            </div>

            <div className="sharing-selector-grid">
              {pg.sharingTypes.map((type) => {
                const tierPrice = calculateTierPrice(type);
                const isSelected = activeSharing === type;
                return (
                  <button
                    key={type}
                    type="button"
                    className={`sharing-card-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setActiveSharing(type)}
                  >
                    <div className="sharing-btn-top">
                      <span className="sharing-type-name">{type}</span>
                      {isSelected && <IconCheck className="sharing-check-icon text-emerald" />}
                    </div>
                    <span className="sharing-price-text">₹{tierPrice}<small>/mo</small></span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Description */}
          <div className="modal-section">
            <h4 className="section-label">Room &amp; Living Overview:</h4>
            <p className="modal-overview-text">{pg.roomOverview}</p>
          </div>

          {/* Direct WhatsApp Quick Connect Banner */}
          <div className="whatsapp-quick-banner">
            <div className="whatsapp-banner-left">
              <div className="whatsapp-icon-circle">
                <IconWhatsApp className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <strong>Direct Host WhatsApp Desk</strong>
                <p>Have questions on curfew, food menu, or bed vacancies? Ask the host right now.</p>
              </div>
            </div>
            <a 
              href={whatsAppLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-whatsapp-chat"
            >
              <IconWhatsApp className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Amenities Grid */}
          <div className="modal-section">
            <h4 className="section-label">Included Amenities &amp; Services:</h4>
            <div className="modal-amenities-grid">
              {pg.amenities.map((item, idx) => (
                <div key={idx} className="modal-amenity-cell">
                  <div className="amenity-check-box">
                    <IconCheck className="w-3.5 h-3.5 text-emerald" />
                  </div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules & Policies */}
          <div className="modal-section rules-section">
            <h4 className="section-label">Safety &amp; House Guidelines:</h4>
            <ul className="modal-rules-list">
              {pg.rules.map((rule, idx) => (
                <li key={idx} className="rule-item">
                  <IconShield className="rule-icon text-indigo" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Campus Visit Scheduler & Lead Generator */}
          <div id="visit-form-box" className="modal-visit-action-card">
            {!visitBooked ? (
              <form onSubmit={handleBookVisit} className="visit-form">
                <div className="visit-text">
                  <div className="visit-badge">
                    <span className="live-dot-green" />
                    <span>Free Campus Inspection • Zero Obligation</span>
                  </div>
                  <h5>Schedule a Free Campus Visit</h5>
                  <p>Inspect the {activeSharing} room, check the mess dining hall, and talk to current residents.</p>
                </div>

                <div className="visit-fields-grid">
                  <div className="visit-field">
                    <label className="field-label">Student Full Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Suyash Sharma"
                      className="visit-input"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="visit-field">
                    <label className="field-label">Mobile Number (WhatsApp)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 98220 12345"
                      className={`visit-input ${phoneError ? 'input-error' : ''}`}
                      value={studentPhone}
                      onChange={(e) => {
                        setStudentPhone(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      required
                    />
                    {phoneError && <span className="field-error-msg">{phoneError}</span>}
                  </div>

                  <div className="visit-field field-span-2">
                    <label className="field-label">Preferred Visit Time Slot</label>
                    <select 
                      className="visit-select"
                      value={visitSlot}
                      onChange={(e) => setVisitSlot(e.target.value)}
                    >
                      <option value="Tomorrow Morning (10:00 AM - 1:00 PM)">Tomorrow Morning (10:00 AM - 1:00 PM)</option>
                      <option value="Tomorrow Evening (4:00 PM - 7:00 PM)">Tomorrow Evening (4:00 PM - 7:00 PM)</option>
                      <option value="This Weekend (Saturday / Sunday)">This Weekend (Saturday / Sunday)</option>
                      <option value="Immediate Admission Intake (Today)">Immediate Admission Intake (Today)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-visit-submit">
                  <span>Schedule Free Visit &amp; Inquire Bed</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="visit-success-box">
                <div className="success-icon-badge">✓</div>
                <div className="success-content">
                  <div className="success-header-row">
                    <h5>Visit Request Registered!</h5>
                    <span className="ref-tag">Ref: {bookingRef}</span>
                  </div>
                  <p>
                    Your enquiry for <strong>{activeSharing}</strong> (₹{currentPrice}/mo) has been delivered straight to the PG Host&apos;s lead center.
                  </p>
                  <div className="success-details-pill">
                    <span>📅 Slot: <strong>{visitSlot}</strong></span>
                    <span>📱 Contact: <strong>{studentPhone}</strong></span>
                  </div>
                  
                  <div className="success-actions-row">
                    <a 
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-success-whatsapp"
                    >
                      <IconWhatsApp className="w-4 h-4" />
                      <span>Chat with Host on WhatsApp Now</span>
                    </a>
                    <button 
                      type="button" 
                      className="btn-success-reset"
                      onClick={() => setVisitBooked(false)}
                    >
                      Book Another Slot
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="modal-sticky-footer">
          <div className="footer-price-col">
            <span className="price-label">Monthly Rent ({activeSharing})</span>
            <div className="price-big">
              <span className="curr">₹</span>
              <span className="val">{currentPrice}</span>
              <span className="period">/month</span>
            </div>
            <span className="brokerage-badge">100% Zero Brokerage Guaranteed</span>
          </div>

          <div className="footer-actions-cluster">
            <button 
              type="button" 
              className={`btn-footer-shortlist ${isSaved ? 'shortlist-active' : ''}`}
              onClick={handleToggleSave}
              title={isSaved ? 'Saved in Shortlist' : 'Save to Shortlist'}
            >
              <IconHeart className={`w-4 h-4 ${isSaved ? 'fill-current text-pink' : ''}`} />
              <span>{isSaved ? 'Shortlisted' : 'Shortlist'}</span>
            </button>

            <a 
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-footer-whatsapp"
              title="Chat with host on WhatsApp"
            >
              <IconWhatsApp className="w-4 h-4 text-emerald" />
              <span>WhatsApp Host</span>
            </a>

            <button 
              type="button" 
              className="btn-reserve-preview"
              onClick={() => {
                const el = document.getElementById('visit-form-box');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  const input = el.querySelector('input');
                  if (input) input.focus();
                }
              }}
            >
              <IconSparkles className="w-4 h-4" />
              <span>Schedule Campus Visit</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
