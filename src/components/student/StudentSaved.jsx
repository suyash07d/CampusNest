import { motion, AnimatePresence } from 'motion/react';
import { 
  IconHeart, 
  IconCompass, 
  IconMapPin, 
  IconShield, 
  IconUtensils, 
  IconCheck, 
  IconClock, 
  IconX 
} from '../Icons';

export default function StudentSaved({
  favourites = [],
  onRemoveFavourite,
  onNavigateDiscover,
  onBrowsePGs,
}) {
  return (
    <div className="student-saved-view">
      <div className="section-title-strip">
        <div>
          <h2 className="section-heading">Saved Accommodations</h2>
          <p className="section-subheading">
            Your personal shortlist for comparing rents, meal mess options, and gate walking times.
          </p>
        </div>
        <div className="saved-counter-badge">
          <IconHeart className="w-4 h-4 text-pink" />
          <span>{favourites.length} PGs Saved</span>
        </div>
      </div>

      {favourites.length === 0 ? (
        <motion.div 
          className="empty-state-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="empty-state-art">
            <div className="art-circle-glow bg-pink-glow">
              <IconHeart className="w-8 h-8 text-pink" />
            </div>
          </div>

          <h3 className="empty-state-headline">Your PG Wishlist is Empty</h3>
          <p className="empty-state-description">
            You haven&apos;t saved any PGs yet. As you explore AplaStay, bookmark accommodations near your college campus to compare rents, amenities, and walking distances side-by-side.
          </p>

          <div className="empty-state-btn-group">
            <button 
              type="button" 
              className="btn-empty-primary"
              onClick={onNavigateDiscover}
            >
              <IconCompass className="w-4 h-4" />
              <span>Discover PGs Near Campus</span>
            </button>

            {onBrowsePGs && (
              <button 
                type="button" 
                className="btn-empty-outline"
                onClick={onBrowsePGs}
              >
                <span>Browse All Pune Listings</span>
              </button>
            )}
          </div>

          {/* Value Strip */}
          <div className="empty-value-strip">
            <div className="empty-value-item">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>100% Zero Brokerage</span>
            </div>
            <div className="empty-value-item">
              <IconClock className="w-4 h-4 text-indigo" />
              <span>Verified Gate Walking Distance</span>
            </div>
            <div className="empty-value-item">
              <IconCheck className="w-4 h-4 text-emerald" />
              <span>Fair Student Security Deposits</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="saved-pgs-grid">
          <AnimatePresence mode="popLayout">
            {favourites.map((fav) => {
              const pg = fav.pg || {};
              return (
                <motion.article 
                  key={fav.id}
                  className="saved-pg-card"
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="saved-card-header">
                    <div className="saved-badge-gender">
                      {pg.gender_type ? `${pg.gender_type.toUpperCase()} PG` : 'STUDENT PG'}
                    </div>
                    {onRemoveFavourite && (
                      <button 
                        type="button" 
                        className="btn-remove-favourite"
                        onClick={() => onRemoveFavourite(fav.id)}
                        title="Remove from saved"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="saved-pg-name">{pg.name || 'Verified PG Accommodation'}</h3>

                  <p className="saved-pg-address">
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>{pg.address || pg.areas?.name || 'Pune'}</span>
                  </p>

                  <div className="saved-pg-details">
                    <div className="detail-chip">
                      <span className="chip-label">Rent:</span>
                      <strong className="chip-value">₹{pg.starting_monthly_rent?.toLocaleString('en-IN') || '—'}/mo</strong>
                    </div>

                    {pg.food_available && (
                      <div className="detail-chip">
                        <IconUtensils className="w-3.5 h-3.5 text-emerald" />
                        <span>Mess Food Included</span>
                      </div>
                    )}
                  </div>

                  <div className="saved-card-footer">
                    <span className="saved-date">
                      Saved on {new Date(fav.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    {onBrowsePGs && (
                      <button 
                        type="button" 
                        className="btn-view-pg"
                        onClick={onBrowsePGs}
                      >
                        <span>View PG</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
