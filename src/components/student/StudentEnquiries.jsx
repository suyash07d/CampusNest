import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconMail, 
  IconCompass, 
  IconShield, 
  IconCalendar, 
  IconCheckCircle, 
  IconClock, 
  IconBuilding,
  IconPhone,
  IconX,
  IconArrowRight,
  IconCheck
} from '../Icons';
import { updateStudentEnquiryStatus } from '../../lib/studentService';

export default function StudentEnquiries({
  enquiries = [],
  onNavigateDiscover,
  onBrowsePGs,
  onSelectPG,
  user,
}) {
  const [localEnquiries, setLocalEnquiries] = useState(enquiries);
  const [toastMsg, setToastMsg] = useState(null);

  // Sync if parent prop updates
  const list = enquiries.length > 0 ? enquiries : localEnquiries;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateStatus = async (enquiryId, newStatus) => {
    // 1. Update local storage
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('aplastay_my_inquiries') || '[]');
        const updated = stored.map(item => item.id === enquiryId ? { ...item, status: newStatus } : item);
        localStorage.setItem('aplastay_my_inquiries', JSON.stringify(updated));
        setLocalEnquiries(updated);
        window.dispatchEvent(new CustomEvent('aplastay:inquiry_status_updated', { detail: { enquiryId, status: newStatus } }));
      } catch (e) { /* ignore */ }
    }

    // 2. Sync to Supabase if authenticated
    if (user?.id) {
      try {
        await updateStudentEnquiryStatus(user.id, enquiryId, newStatus);
      } catch (err) {
        console.warn('Could not sync status remotely:', err);
      }
    }

    const labels = {
      closed: 'Visit request cancelled.',
      bed_reserved: 'Congratulations! Bed marked as reserved 🎉',
      visit_scheduled: 'Visit confirmed on your calendar.',
    };
    showToast(labels[newStatus] || 'Status updated.');
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'bed_reserved':
        return 'Bed Reserved';
      case 'visit_scheduled':
      case 'Confirmed':
        return 'Host Confirmed';
      case 'contacted':
        return 'Host Contacted';
      case 'closed':
        return 'Visit Cancelled';
      default:
        return 'Awaiting Host Response';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'bed_reserved':
        return 'status-reserved';
      case 'visit_scheduled':
      case 'Confirmed':
        return 'status-scheduled';
      case 'contacted':
        return 'status-contacted';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-pending';
    }
  };

  const getWhatsAppLink = (enq) => {
    const rawPhone = enq.ownerPhone || enq.phone || '9876543210';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const pgName = enq.pgName || enq.pg?.name || 'the accommodation';
    const ref = enq.refId || (enq.id ? enq.id.slice(0, 8) : 'AS-VISIT');
    const sharing = enq.sharing || enq.room_type_preference || 'Sharing';
    const slot = enq.slot || (enq.visit_date ? new Date(enq.visit_date).toLocaleDateString('en-IN') : 'upcoming slot');
    
    const msg = encodeURIComponent(
      `Hello! I requested an in-person room visit on AplaStay for ${pgName} (Ref: ${ref}) for ${sharing} on ${slot}. Looking forward to confirming the schedule!`
    );
    return `https://wa.me/91${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="student-enquiries-view">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            className="student-toast-notice"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <IconCheck className="w-4 h-4 text-emerald" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="section-title-strip">
        <div>
          <h2 className="section-heading">My Campus Enquiries &amp; Visits</h2>
          <p className="section-subheading">
            Track host communications, scheduled property tours, and room availability with zero brokerage.
          </p>
        </div>
        <div className="enquiries-counter-badge">
          <IconMail className="w-4 h-4 text-amber" />
          <span>{list.length} Inquiries</span>
        </div>
      </div>

      {list.length === 0 ? (
        <motion.div 
          className="empty-state-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="empty-state-art">
            <div className="art-circle-glow bg-amber-glow">
              <IconMail className="w-8 h-8 text-amber" />
            </div>
          </div>

          <h3 className="empty-state-headline">No Active Enquiries or Campus Visits</h3>
          <p className="empty-state-description">
            You haven&apos;t sent any enquiries or visit requests yet. When you discover a PG on AplaStay, you can reach out directly to verified hosts to confirm room availability and schedule in-person tours with zero middlemen brokerage.
          </p>

          <div className="empty-state-btn-group">
            <button 
              type="button" 
              className="btn-empty-primary"
              onClick={onNavigateDiscover}
            >
              <IconCompass className="w-4 h-4" />
              <span>Discover PGs to Enquire</span>
            </button>

            {onBrowsePGs && (
              <button 
                type="button" 
                className="btn-empty-outline"
                onClick={onBrowsePGs}
              >
                <span>Browse Live PG Radar</span>
              </button>
            )}
          </div>

          {/* Value Strip */}
          <div className="empty-value-strip">
            <div className="empty-value-item">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>Direct Host Connect</span>
            </div>
            <div className="empty-value-item">
              <IconCheckCircle className="w-4 h-4 text-emerald" />
              <span>Zero Middlemen Fees</span>
            </div>
            <div className="empty-value-item">
              <IconCalendar className="w-4 h-4 text-indigo" />
              <span>Pre-Admission Visit Scheduling</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="enquiries-list">
          {list.map((enq) => {
            const pg = enq.pg || {};
            const pgName = enq.pgName || pg.name || 'Verified PG Accommodation';
            const pgArea = enq.pgArea || pg.areas?.name || pg.address || 'Pune';
            const sharingType = enq.sharing || enq.room_type_preference || 'Standard Sharing';
            const slotOrDate = enq.slot || (enq.visit_date ? new Date(enq.visit_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Flexible Slot');
            const submitDate = enq.date || (enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');
            const isConfirmed = enq.status === 'Confirmed' || enq.status === 'visit_scheduled';
            const isBedReserved = enq.status === 'bed_reserved';
            const isClosed = enq.status === 'closed';

            return (
              <article key={enq.id} className={`enquiry-card ${isClosed ? 'is-closed-card' : ''}`}>
                <div className="enquiry-card-header">
                  <div className="enquiry-pg-info">
                    <IconBuilding className="w-5 h-5 text-indigo" />
                    <div>
                      <div className="enquiry-name-row">
                        <h3 className="enquiry-pg-name">{pgName}</h3>
                        {enq.refId && <span className="enquiry-ref-pill">Ref: {enq.refId}</span>}
                      </div>
                      <span className="enquiry-pg-area">
                        📍 {pgArea}
                      </span>
                    </div>
                  </div>

                  <div className={`enquiry-status-pill ${getStatusClass(enq.status)}`}>
                    <IconClock className="w-3.5 h-3.5" />
                    <span>{getStatusLabel(enq.status)}</span>
                  </div>
                </div>

                <div className="enquiry-meta-grid">
                  <div className="meta-box">
                    <span className="meta-label">Sharing &amp; Rent:</span>
                    <span className="meta-val">
                      {sharingType} {enq.rent ? `(₹${enq.rent}/mo)` : ''}
                    </span>
                  </div>

                  <div className="meta-box">
                    <span className="meta-label">Visit Slot:</span>
                    <span className="meta-val">
                      {slotOrDate}
                    </span>
                  </div>

                  <div className="meta-box">
                    <span className="meta-label">Submitted:</span>
                    <span className="meta-val">
                      {submitDate}
                    </span>
                  </div>
                </div>

                {enq.message && (
                  <div className="enquiry-message-quote">
                    <span className="quote-label">Your Note to Host:</span>
                    <p className="quote-text">&ldquo;{enq.message}&rdquo;</p>
                  </div>
                )}

                {/* Direct Action Hub for Student */}
                <div className="enquiry-actions-bar">
                  <div className="enquiry-contact-btns">
                    <a
                      href={getWhatsAppLink(enq)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-enquiry-wa"
                      title="Follow up with host on WhatsApp"
                    >
                      <IconPhone className="w-3.5 h-3.5" />
                      <span>WhatsApp Host</span>
                    </a>

                    <button
                      type="button"
                      className="btn-enquiry-inspect"
                      onClick={() => {
                        if (onSelectPG) onSelectPG(pg.id ? pg : { ...enq, name: pgName, address: pgArea });
                        else if (onBrowsePGs) onBrowsePGs(pg);
                      }}
                    >
                      <span>View PG Details</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isClosed && !isBedReserved && (
                    <div className="enquiry-status-controls">
                      <button
                        type="button"
                        className="btn-status-bed"
                        onClick={() => handleUpdateStatus(enq.id, 'bed_reserved')}
                        title="Mark bed as successfully reserved"
                      >
                        <IconCheck className="w-3.5 h-3.5" />
                        <span>Reserve Bed</span>
                      </button>

                      <button
                        type="button"
                        className="btn-status-cancel"
                        onClick={() => handleUpdateStatus(enq.id, 'closed')}
                        title="Cancel this visit request"
                      >
                        <IconX className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}

                  {isBedReserved && (
                    <div className="enquiry-bed-confirmed-tag">
                      🎉 Bed Confirmed
                    </div>
                  )}

                  {isClosed && (
                    <span className="enquiry-cancelled-tag">
                      Cancelled
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
