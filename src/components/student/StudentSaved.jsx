import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  IconHeart, 
  IconCompass, 
  IconMapPin, 
  IconShield, 
  IconUtensils, 
  IconCheck, 
  IconClock, 
  IconX,
  IconArrowRight,
  IconPhone
} from '../Icons';

export default function StudentSaved({
  favourites = [],
  onRemoveFavourite,
  onNavigateDiscover,
  onBrowsePGs,
  onSelectPG,
}) {
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const getPG = (fav) => fav.pg || fav || {};

  const handleToggleSelectCompare = (id, e) => {
    e?.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 accommodations side-by-side.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleOpenCompare = () => {
    if (favourites.length < 2) return;
    if (selectedForCompare.length < 2) {
      setSelectedForCompare(favourites.slice(0, 3).map(f => (f.id || f.pg?.id)));
    }
    setIsCompareOpen(true);
  };

  const comparedPGs = favourites
    .filter(f => selectedForCompare.includes(f.id || f.pg?.id))
    .map(getPG);

  const getRentVal = (pg) => {
    if (pg.starting_monthly_rent) return `₹${pg.starting_monthly_rent.toLocaleString('en-IN')}/mo`;
    if (pg.rent) return `₹${pg.rent}/mo`;
    return '₹7,500/mo';
  };

  const getSharingRent = (pg, tier) => {
    if (pg.rooms && Array.isArray(pg.rooms)) {
      const match = pg.rooms.find(r => r.room_type?.toLowerCase().includes(tier.toLowerCase()));
      if (match?.monthly_rent) return `₹${match.monthly_rent.toLocaleString('en-IN')}/mo`;
    }
    if (pg.pricing && pg.pricing[tier.toLowerCase()]) {
      return `₹${pg.pricing[tier.toLowerCase()]}/mo`;
    }
    const base = pg.starting_monthly_rent || 7500;
    if (tier.toLowerCase() === 'single') return `₹${Math.round(base * 1.5).toLocaleString('en-IN')}/mo`;
    if (tier.toLowerCase() === 'double') return `₹${Math.round(base * 1.1).toLocaleString('en-IN')}/mo`;
    if (tier.toLowerCase() === 'triple') return `₹${base.toLocaleString('en-IN')}/mo`;
    return 'Available on Request';
  };

  const getFoodText = (pg) => {
    if (pg.food_type) return `${pg.food_type} Included`;
    if (pg.food_available) return '3 Meals Mess Included';
    if (pg.tags?.some(t => t.toLowerCase().includes('meal'))) return 'Meal Options Included';
    return 'Self-cooking / Tiffin Area';
  };

  const getDistanceText = (pg) => {
    if (pg.distance) return `${pg.distance} to Campus Gate`;
    if (pg.colleges?.[0]?.distance_meters) {
      return `${pg.colleges[0].distance_meters}m to ${pg.colleges[0].college?.name || 'Campus'}`;
    }
    return '< 450m walking distance';
  };

  const getDepositText = (pg) => {
    if (pg.security_deposit) return `₹${pg.security_deposit.toLocaleString('en-IN')}`;
    if (pg.deposit) return `₹${pg.deposit}`;
    return '1 Month Rent Refundable';
  };

  const getWhatsAppLink = (pg) => {
    const rawPhone = pg.ownerPhone || pg.phone || '9876543210';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const msg = encodeURIComponent(
      `Hello! I found ${pg.name || 'your PG'} on AplaStay and am comparing shortlisted accommodations. Could you confirm room availability and time slots for an in-person room visit?`
    );
    return `https://wa.me/91${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="student-saved-view">
      <div className="section-title-strip">
        <div>
          <h2 className="section-heading">Saved Accommodations</h2>
          <p className="section-subheading">
            Your personal shortlist for comparing sharing rents, mess meals, and campus walking times.
          </p>
        </div>
        <div className="saved-header-actions">
          {favourites.length >= 2 && (
            <button
              type="button"
              className="btn-compare-trigger"
              onClick={handleOpenCompare}
            >
              <span>⚖️ Compare Shortlist</span>
              {selectedForCompare.length > 0 && (
                <span className="compare-badge">{selectedForCompare.length}</span>
              )}
            </button>
          )}
          <div className="saved-counter-badge">
            <IconHeart className="w-4 h-4 text-pink" />
            <span>{favourites.length} Saved</span>
          </div>
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

          <h3 className="empty-state-headline">Your Shortlist is Empty</h3>
          <p className="empty-state-description">
            You haven&apos;t bookmarked any accommodations yet. Explore verified student PGs near your Pune college campus and bookmark your favorites to compare room pricing and amenities side-by-side.
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
              <span>Honest Walking Distances</span>
            </div>
            <div className="empty-value-item">
              <IconCheck className="w-4 h-4 text-emerald" />
              <span>Transparent Deposit Terms</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="saved-pgs-grid">
          <AnimatePresence mode="popLayout">
            {favourites.map((fav) => {
              const pg = getPG(fav);
              const favId = fav.id || pg.id;
              const isSelected = selectedForCompare.includes(favId);
              const rentVal = getRentVal(pg);
              const addressVal = pg.address || pg.areas?.name || pg.area || 'Pune';
              const hasFood = pg.food_available || pg.tags?.some(t => t.toLowerCase().includes('meal')) || pg.amenities?.some(a => a?.name?.toLowerCase().includes('meal'));

              return (
                <motion.article 
                  key={favId}
                  className={`saved-pg-card ${isSelected ? 'card-selected-compare' : ''}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="saved-card-header">
                    <div className="saved-badge-gender">
                      {pg.gender_type ? `${pg.gender_type.toUpperCase()} PG` : pg.gender ? `${pg.gender.toUpperCase()} PG` : 'STUDENT PG'}
                    </div>

                    <div className="saved-card-top-actions">
                      <button
                        type="button"
                        className={`btn-compare-check ${isSelected ? 'is-selected' : ''}`}
                        onClick={(e) => handleToggleSelectCompare(favId, e)}
                        title={isSelected ? 'Remove from comparison' : 'Select to compare'}
                      >
                        {isSelected ? '✓ In Compare' : '+ Compare'}
                      </button>

                      {onRemoveFavourite && (
                        <button 
                          type="button" 
                          className="btn-remove-favourite"
                          onClick={() => onRemoveFavourite(favId)}
                          title="Remove from saved"
                        >
                          <IconX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="saved-pg-name">{pg.name || 'Verified PG Accommodation'}</h3>

                  <p className="saved-pg-address">
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>{addressVal}</span>
                  </p>

                  <div className="saved-pg-details">
                    <div className="detail-chip">
                      <span className="chip-label">Starting:</span>
                      <strong className="chip-value">{rentVal}</strong>
                    </div>

                    {hasFood && (
                      <div className="detail-chip">
                        <IconUtensils className="w-3.5 h-3.5 text-emerald" />
                        <span>Mess Included</span>
                      </div>
                    )}
                  </div>

                  <div className="saved-card-footer">
                    <a
                      href={getWhatsAppLink(pg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-quick"
                      title="Direct WhatsApp chat with host"
                    >
                      <IconPhone className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button 
                      type="button" 
                      className="btn-view-pg"
                      onClick={() => {
                        if (onSelectPG) onSelectPG(pg);
                        else if (onBrowsePGs) onBrowsePGs(pg);
                      }}
                    >
                      <span>View Details</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {isCompareOpen && (
          <div className="compare-modal-backdrop" onClick={() => setIsCompareOpen(false)}>
            <motion.div 
              className="compare-modal-window"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="compare-modal-header">
                <div>
                  <div className="compare-header-pill">⚖️ SIDE-BY-SIDE MATRIX</div>
                  <h3 className="compare-modal-title">Compare Shortlisted Accommodations</h3>
                  <p className="compare-modal-sub">
                    Direct feature comparison to help you find the best value and location for your college stay.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="compare-modal-close"
                  onClick={() => setIsCompareOpen(false)}
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <div className="compare-table-wrapper">
                <table className="compare-matrix-table">
                  <thead>
                    <tr>
                      <th className="matrix-th-feature">Accommodation</th>
                      {comparedPGs.map(pg => (
                        <th key={pg.id || pg.name} className="matrix-th-pg">
                          <div className="matrix-pg-head">
                            <span className="matrix-gender-pill">
                              {pg.gender_type ? pg.gender_type.toUpperCase() : pg.gender ? pg.gender.toUpperCase() : 'STUDENT'} PG
                            </span>
                            <h4 className="matrix-pg-title">{pg.name}</h4>
                            <span className="matrix-pg-loc">📍 {pg.address || pg.area || 'Pune'}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="matrix-feature-name">Starting Rent</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val matrix-highlight-rent">
                          {getRentVal(pg)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Single Room</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          {getSharingRent(pg, 'single')}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Double Sharing</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          {getSharingRent(pg, 'double')}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Triple Sharing</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          {getSharingRent(pg, 'triple')}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Campus Walk Proximity</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val matrix-val-walk">
                          <IconClock className="w-3.5 h-3.5 text-indigo inline-block mr-1" />
                          {getDistanceText(pg)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Mess &amp; Food Policy</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          <IconUtensils className="w-3.5 h-3.5 text-emerald inline-block mr-1" />
                          {getFoodText(pg)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Security Deposit</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          {getDepositText(pg)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Notice Period</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val">
                          {pg.notice_period_days || pg.noticePeriod || '30'} Days
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="matrix-feature-name">Zero Brokerage</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val text-emerald font-semibold">
                          ✓ 100% Direct Host
                        </td>
                      ))}
                    </tr>
                    <tr className="matrix-row-actions">
                      <td className="matrix-feature-name">Next Steps</td>
                      {comparedPGs.map(pg => (
                        <td key={pg.id || pg.name} className="matrix-val matrix-actions-cell">
                          <div className="matrix-btn-stack">
                            <a
                              href={getWhatsAppLink(pg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="matrix-btn-whatsapp"
                            >
                              <IconPhone className="w-3.5 h-3.5" />
                              <span>WhatsApp Host</span>
                            </a>
                            <button
                              type="button"
                              className="matrix-btn-inspect"
                              onClick={() => {
                                setIsCompareOpen(false);
                                if (onSelectPG) onSelectPG(pg);
                                else if (onBrowsePGs) onBrowsePGs(pg);
                              }}
                            >
                              <span>View Tour &amp; Book</span>
                              <IconArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
