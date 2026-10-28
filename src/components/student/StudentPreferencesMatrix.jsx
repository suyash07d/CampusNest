import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  IconSliders, 
  IconCheck, 
  IconUtensils, 
  IconWifi, 
  IconZap, 
  IconUsers, 
  IconClock, 
  IconShield,
  IconSparkles,
  IconHome
} from '../Icons';

const AMENITY_TAGS = [
  { id: 'attached_bath', label: 'Attached Washroom', icon: IconHome },
  { id: 'wifi', label: 'High-Speed Wi-Fi', icon: IconWifi },
  { id: 'ac', label: 'Air Conditioned (AC)', icon: IconZap },
  { id: 'no_curfew', label: 'Flexible / No Curfew', icon: IconClock },
  { id: 'veg_food', label: 'Pure Veg Mess Available', icon: IconUtensils },
  { id: 'power_backup', label: '24/7 Power Backup', icon: IconZap },
  { id: 'laundry', label: 'Laundry & Washing Machine', icon: IconCheck },
  { id: 'security', label: 'CCTV & Biometric Entry', icon: IconShield },
];

export default function StudentPreferencesMatrix({
  onBrowsePGs,
  onSelectTab,
}) {
  const [budgetIndex, setBudgetIndex] = useState(1); // 0: Budget, 1: Comfort, 2: Premium
  const [sharingType, setSharingType] = useState('twin'); // 'single', 'twin', 'triple'
  const [dietType, setDietType] = useState('any'); // 'veg', 'any'
  const [selectedAmenities, setSelectedAmenities] = useState(['wifi', 'attached_bath', 'no_curfew']);
  const [savedNotice, setSavedNotice] = useState(false);

  const budgetTiers = [
    { label: 'Budget-Friendly', range: '₹4,500 – ₹7,500/mo', desc: 'Standard sharing rooms with clean essentials' },
    { label: 'Student Comfort', range: '₹8,000 – ₹13,000/mo', desc: 'Airy twin/single rooms with mess & Wi-Fi' },
    { label: 'Premium Living', range: '₹14,000 – ₹22,000/mo', desc: 'Private studio PGs with AC, gym & housekeeping' },
  ];

  const toggleAmenity = (id) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Dynamic compatibility calculation
  const matchPercentage = Math.min(98, 74 + (selectedAmenities.length * 3) + (budgetIndex * 2));

  return (
    <section className="student-preferences-card" aria-labelledby="preferences-heading">
      <div className="preferences-glow" aria-hidden="true" />

      {/* Header */}
      <div className="preferences-header">
        <div className="preferences-header-left">
          <div className="preferences-icon-chip">
            <IconSliders className="w-5 h-5 text-indigo" />
          </div>
          <div>
            <div className="preferences-eyebrow">SMART HOUSING MATCH</div>
            <h2 id="preferences-heading" className="preferences-title">Your Living & Budget Preferences</h2>
          </div>
        </div>

        {/* Compatibility Meter */}
        <div className="preferences-match-pill">
          <IconSparkles className="w-4 h-4 text-emerald" />
          <span className="match-val">{matchPercentage}% Match</span>
          <span className="match-sub">with Pune listings</span>
        </div>
      </div>

      <div className="preferences-body-grid">
        {/* Left Column: Budget & Sharing */}
        <div className="preferences-col">
          {/* 1. Monthly Budget Tier */}
          <div className="pref-block">
            <div className="pref-block-label">
              <span>Target Monthly Rent Budget</span>
              <span className="pref-current-budget">{budgetTiers[budgetIndex].range}</span>
            </div>

            <div className="budget-tier-pills">
              {budgetTiers.map((tier, idx) => {
                const isActive = budgetIndex === idx;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    className={`budget-tier-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => setBudgetIndex(idx)}
                  >
                    <span className="tier-name">{tier.label}</span>
                    <span className="tier-price">{tier.range}</span>
                  </button>
                );
              })}
            </div>
            <p className="tier-description">{budgetTiers[budgetIndex].desc}</p>
          </div>

          {/* 2. Room Occupancy */}
          <div className="pref-block">
            <div className="pref-block-label">
              <span>Room Occupancy Preference</span>
            </div>

            <div className="sharing-toggles-row">
              <button
                type="button"
                className={`sharing-toggle-btn ${sharingType === 'single' ? 'is-active' : ''}`}
                onClick={() => setSharingType('single')}
              >
                <IconHome className="w-4 h-4" />
                <span>Single Room</span>
              </button>

              <button
                type="button"
                className={`sharing-toggle-btn ${sharingType === 'twin' ? 'is-active' : ''}`}
                onClick={() => setSharingType('twin')}
              >
                <IconUsers className="w-4 h-4" />
                <span>Twin Sharing</span>
              </button>

              <button
                type="button"
                className={`sharing-toggle-btn ${sharingType === 'triple' ? 'is-active' : ''}`}
                onClick={() => setSharingType('triple')}
              >
                <IconUsers className="w-4 h-4" />
                <span>3+ Sharing</span>
              </button>
            </div>
          </div>

          {/* 3. Food & Mess */}
          <div className="pref-block">
            <div className="pref-block-label">
              <span>Food & Mess Preference</span>
            </div>

            <div className="sharing-toggles-row">
              <button
                type="button"
                className={`sharing-toggle-btn ${dietType === 'veg' ? 'is-active' : ''}`}
                onClick={() => setDietType('veg')}
              >
                <IconUtensils className="w-4 h-4 text-emerald" />
                <span>Pure Veg Only</span>
              </button>

              <button
                type="button"
                className={`sharing-toggle-btn ${dietType === 'any' ? 'is-active' : ''}`}
                onClick={() => setDietType('any')}
              >
                <IconUtensils className="w-4 h-4 text-indigo" />
                <span>All Diets Permitted</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Key Amenities & Match Preview */}
        <div className="preferences-col">
          <div className="pref-block">
            <div className="pref-block-label">
              <span>Essential Facilities ({selectedAmenities.length} selected)</span>
            </div>

            <div className="amenities-chips-grid">
              {AMENITY_TAGS.map((tag) => {
                const isSelected = selectedAmenities.includes(tag.id);
                const Icon = tag.icon;
                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    className={`amenity-toggle-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleAmenity(tag.id)}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Icon className="w-4 h-4 chip-icon" />
                    <span className="chip-text">{tag.label}</span>
                    {isSelected && <IconCheck className="w-3.5 h-3.5 chip-check" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="pref-actions-row">
            <button
              type="button"
              className="btn-pref-save"
              onClick={handleSavePreferences}
            >
              <IconCheck className="w-4 h-4" />
              <span>{savedNotice ? 'Preferences Applied!' : 'Save Filter Profile'}</span>
            </button>

            <button
              type="button"
              className="btn-pref-search"
              onClick={() => onBrowsePGs ? onBrowsePGs() : onSelectTab && onSelectTab('discover')}
            >
              <span>View Matching PGs</span>
              <IconSparkles className="w-4 h-4 text-amber" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
