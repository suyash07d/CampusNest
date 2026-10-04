import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { IconX, IconBuilding, IconCheck, IconShield } from './Icons';
import './OwnerModal.css';

export default function OwnerModal({ onClose }) {
  const [formData, setFormData] = useState({
    propertyName: '',
    city: 'pune',
    nearestCollege: '',
    totalBeds: '',
    phone: '',
    hasMess: true,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="owner-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-modal-title"
      >
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <IconX className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div className="owner-modal-body">
            <div className="owner-modal-header">
              <div className="owner-icon-tag">
                <IconBuilding className="w-5 h-5 text-indigo" />
              </div>
              <h2 id="owner-modal-title" className="owner-modal-title">Partner with CampusNest</h2>
              <p className="owner-modal-desc">
                List your student PG or hostel property and get discovered by students admitted to nearby colleges.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="owner-form">
              <div className="form-group">
                <label className="form-label">Property / PG Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Balaji Student Residency"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <select 
                    className="form-select"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    <option value="pune">Pune</option>
                    <option value="bengaluru">Bengaluru</option>
                    <option value="delhi-ncr">Delhi NCR</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="hyderabad">Hyderabad</option>
                    <option value="kota">Kota</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacity (Beds)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 24"
                    value={formData.totalBeds}
                    onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nearest College / Campus Gate</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. DY Patil Institute of Tech, Pimpri"
                  value={formData.nearestCollege}
                  onChange={(e) => setFormData({ ...formData, nearestCollege: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Host WhatsApp / Contact Number</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required 
                />
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.hasMess}
                    onChange={(e) => setFormData({ ...formData, hasMess: e.target.checked })}
                  />
                  <span>Provides daily meals / mess facility</span>
                </label>
              </div>

              <button type="submit" className="owner-submit-btn">
                <span>Submit Property for Verification</span>
              </button>
            </form>

            <div className="owner-modal-guarantee">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>Zero upfront commission during initial partner program</span>
            </div>
          </div>
        ) : (
          <div className="owner-success-view">
            <div className="success-check-badge">
              <IconCheck className="w-8 h-8 text-white" />
            </div>
            <h3>Listing Application Received!</h3>
            <p>
              Thank you for partnering with CampusNest. Our regional property onboarding 
              team for <strong>{formData.city.toUpperCase()}</strong> will contact you via WhatsApp on{' '}
              <strong>{formData.phone || '+91-XXXXX'}</strong> to conduct physical room verification and photo cataloging.
            </p>
            <div className="onboarding-steps-summary">
              <div className="summary-step">1. Physical Campus Distance Verification</div>
              <div className="summary-step">2. Food Hygiene & Safety Audit</div>
              <div className="summary-step">3. Student Admission Season Catalog Launch</div>
            </div>
            <button type="button" className="btn-done" onClick={onClose}>
              Back to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
