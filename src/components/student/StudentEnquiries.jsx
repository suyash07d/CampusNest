import { motion } from 'motion/react';
import { 
  IconMail, 
  IconCompass, 
  IconShield, 
  IconCalendar, 
  IconCheckCircle, 
  IconClock, 
  IconBuilding 
} from '../Icons';

export default function StudentEnquiries({
  enquiries = [],
  onNavigateDiscover,
  onBrowsePGs,
}) {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'contacted':
        return 'Host Contacted';
      case 'visit_scheduled':
        return 'Visit Scheduled';
      case 'closed':
        return 'Enquiry Closed';
      default:
        return 'Awaiting Host Response';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'contacted':
        return 'status-contacted';
      case 'visit_scheduled':
        return 'status-scheduled';
      case 'closed':
        return 'status-closed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="student-enquiries-view">
      <div className="section-title-strip">
        <div>
          <h2 className="section-heading">My Campus Enquiries & Visits</h2>
          <p className="section-subheading">
            Track host communications, scheduled property tours, and room availability with zero brokerage.
          </p>
        </div>
        <div className="enquiries-counter-badge">
          <IconMail className="w-4 h-4 text-amber" />
          <span>{enquiries.length} Inquiries</span>
        </div>
      </div>

      {enquiries.length === 0 ? (
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
          {enquiries.map((enq) => {
            const pg = enq.pg || {};
            const pgName = enq.pgName || pg.name || 'Verified PG Accommodation';
            const pgArea = enq.pgArea || pg.areas?.name || pg.address || 'Pune';
            const sharingType = enq.sharing || enq.room_type_preference || 'Standard Sharing';
            const slotOrDate = enq.slot || (enq.visit_date ? new Date(enq.visit_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Flexible Slot');
            const submitDate = enq.date || (enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');
            const isConfirmed = enq.status === 'Confirmed' || enq.status === 'visit_scheduled';

            return (
              <article key={enq.id} className="enquiry-card">
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

                  <div className={`enquiry-status-pill ${isConfirmed ? 'status-scheduled' : getStatusClass(enq.status)}`}>
                    <IconClock className="w-3.5 h-3.5" />
                    <span>{isConfirmed ? '✓ Host Confirmed' : getStatusLabel(enq.status)}</span>
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
