import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  IconBuilding, 
  IconShield, 
  IconUsers, 
  IconArrowRight, 
  IconLogOut, 
  IconCheck, 
  IconMapPin, 
  IconSparkles, 
  IconCamera, 
  IconX,
  IconInfo
} from './Icons';
import './OwnerDashboard.css';

// Default sample photos for Pune PG
const INITIAL_PHOTOS = [
  { id: 'p1', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', tag: 'Cover Facade', isCover: true },
  { id: 'p2', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80', tag: 'Triple Sharing Room', isCover: false },
  { id: 'p3', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', tag: 'Attached Washroom', isCover: false },
  { id: 'p4', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', tag: 'Study & Dining Hall', isCover: false }
];

// Default sample student leads
const INITIAL_LEADS = [
  { id: 'l1', studentName: 'Aarav Sharma', college: 'COEP Tech (Computer Engineering)', sharing: 'Triple Sharing', date: 'Oct 28', status: 'Pending Review', phone: '+91 98231 45678' },
  { id: 'l2', studentName: 'Ananya Kulkarni', college: 'MIT-WPU (BBA)', sharing: 'Double Sharing (AC)', date: 'Oct 27', status: 'Confirmed', phone: '+91 98902 34567' },
  { id: 'l3', studentName: 'Rohan Deshmukh', college: 'PICT (EnTC)', sharing: 'Single Room', date: 'Oct 26', status: 'Pending Review', phone: '+91 97654 89123' },
];

export default function OwnerDashboard({ onGoToHome }) {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'PG Host';
  const displayEmail = user?.email || profile?.email || '';

  // Active Tab
  const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'photos' | 'property' | 'amenities' | 'leads'

  // Property Details State
  const [propertyData, setPropertyData] = useState(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const saved = localStorage.getItem(`aplastay_owner_${user.id}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return {
      propertyName: 'AplaStay Residency & Hostel',
      gender: 'Boys Only', // 'Boys Only' | 'Girls Only' | 'Co-ed'
      area: 'Shivajinagar',
      nearestCollege: 'COEP Technological University',
      walkingDistanceMeters: 350,
      walkingTimeMinutes: 4,
      hostPhone: '+91 98220 12345',
      address: 'Lane 4, Near JM Road, Shivajinagar, Pune 411005',
      // Multi-tier sharing pricing
      roomTiers: {
        single: { enabled: true, rent: 12500, capacity: 4, occupied: 2, hasAC: true },
        double: { enabled: true, rent: 8500, capacity: 10, occupied: 6, hasAC: true },
        triple: { enabled: true, rent: 6500, capacity: 15, occupied: 9, hasAC: false },
        four: { enabled: true, rent: 5200, capacity: 8, occupied: 5, hasAC: false }
      },
      depositMonths: 1,
      depositAmount: 6500,
      foodIncluded: true,
      foodType: 'Pure Veg & Hygenic Mess',
      foodCostAddon: 2500,
      amenities: {
        wifi: true,
        powerBackup: true,
        roWater: true,
        cleaning: true,
        cctv: true,
        geyser: true,
        washingMachine: true,
        airConditioner: true,
        studyTable: true,
        biometricGate: true
      }
    };
  });

  // Photos State
  const [photos, setPhotos] = useState(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const savedPhotos = localStorage.getItem(`aplastay_photos_${user.id}`);
      if (savedPhotos) {
        try { return JSON.parse(savedPhotos); } catch (e) { /* ignore */ }
      }
    }
    return INITIAL_PHOTOS;
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState('Bedroom View');
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Save changes to localStorage & trigger notice
  const handleSaveAll = () => {
    if (user?.id) {
      localStorage.setItem(`aplastay_owner_${user.id}`, JSON.stringify(propertyData));
      localStorage.setItem(`aplastay_photos_${user.id}`, JSON.stringify(photos));
    }
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 3500);
  };

  // Add Photo via URL
  const handleAddPhotoUrl = (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const newEntry = {
      id: `p_${Date.now()}`,
      url: newPhotoUrl.trim(),
      tag: newPhotoTag,
      isCover: photos.length === 0
    };
    setPhotos(prev => [newEntry, ...prev]);
    setNewPhotoUrl('');
  };

  // Handle Local File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        const newEntry = {
          id: `p_${Date.now()}`,
          url: base64,
          tag: newPhotoTag,
          isCover: photos.length === 0
        };
        setPhotos(prev => [newEntry, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSetCoverPhoto = (id) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      isCover: p.id === id
    })));
  };

  const updateTier = (tierKey, field, value) => {
    setPropertyData(prev => ({
      ...prev,
      roomTiers: {
        ...prev.roomTiers,
        [tierKey]: {
          ...prev.roomTiers[tierKey],
          [field]: value
        }
      }
    }));
  };

  const toggleAmenity = (amenityKey) => {
    setPropertyData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityKey]: !prev.amenities[amenityKey]
      }
    }));
  };

  const updateLeadStatus = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  // Compute total capacity and available vacancies
  const totalCapacity = Object.values(propertyData.roomTiers).reduce((sum, t) => sum + (t.enabled ? Number(t.capacity) : 0), 0);
  const totalOccupied = Object.values(propertyData.roomTiers).reduce((sum, t) => sum + (t.enabled ? Number(t.occupied) : 0), 0);
  const totalVacancies = Math.max(0, totalCapacity - totalOccupied);

  return (
    <div className="owner-dash-root">
      <div className="container owner-dash-container">
        
        {/* Top Header Card */}
        <div className="owner-top-card">
          <div className="top-card-left">
            <div className="owner-badge">
              <IconBuilding className="w-4 h-4 text-cyan" />
              <span>APLASTAY PROPERTY HOST COMMAND</span>
              <span className="badge-status-dot" />
            </div>
            <h1 className="owner-heading">{propertyData.propertyName}</h1>
            <p className="owner-location-sub">
              📍 {propertyData.area}, Pune • Anchor: <strong>{propertyData.nearestCollege}</strong> ({propertyData.walkingDistanceMeters}m / {propertyData.walkingTimeMinutes} mins gate walk)
            </p>
          </div>

          <div className="top-card-actions">
            <button 
              type="button" 
              className="btn-save-master"
              onClick={handleSaveAll}
            >
              <IconCheck className="w-4 h-4" />
              <span>Save &amp; Update Live Listing</span>
            </button>

            <button 
              type="button" 
              className="btn-dash-logout"
              onClick={signOut}
              title="Sign out of host session"
            >
              <IconLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Save Notice Toast */}
        {saveSuccessNotice && (
          <div className="owner-toast-success">
            <IconCheck className="w-5 h-5 text-emerald" />
            <div>
              <strong>Listing Changes Saved Successfully!</strong>
              <p>Your room sharing pricing, photos, and vacancies are updated live on AplaStay.</p>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="owner-metrics-grid">
          <div className="metric-box">
            <span className="metric-num text-cyan">{totalVacancies}</span>
            <span className="metric-label">Open Vacant Beds</span>
            <span className="metric-caption">Ready for immediate move-in</span>
          </div>

          <div className="metric-box">
            <span className="metric-num text-violet">{totalCapacity}</span>
            <span className="metric-label">Total Student Capacity</span>
            <span className="metric-caption">Across 4 sharing room types</span>
          </div>

          <div className="metric-box">
            <span className="metric-num text-emerald">₹{propertyData.roomTiers.triple.rent.toLocaleString()}</span>
            <span className="metric-label">Triple Sharing Rent</span>
            <span className="metric-caption">Most popular student tier</span>
          </div>

          <div className="metric-box">
            <span className="metric-num text-amber">{leads.filter(l => l.status === 'Pending Review').length}</span>
            <span className="metric-label">New Student Leads</span>
            <span className="metric-caption">Awaiting your response</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="owner-nav-tabs">
          <button 
            type="button" 
            className={`owner-tab-btn ${activeTab === 'pricing' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <span>💰 Room Sharing &amp; Pricing</span>
          </button>

          <button 
            type="button" 
            className={`owner-tab-btn ${activeTab === 'photos' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <span>📸 PG Centre Photos ({photos.length})</span>
          </button>

          <button 
            type="button" 
            className={`owner-tab-btn ${activeTab === 'property' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('property')}
          >
            <span>🏢 Property &amp; Campus Anchor</span>
          </button>

          <button 
            type="button" 
            className={`owner-tab-btn ${activeTab === 'amenities' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('amenities')}
          >
            <span>🛡️ Amenities &amp; Facilities</span>
          </button>

          <button 
            type="button" 
            className={`owner-tab-btn ${activeTab === 'leads' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <span>👥 Student Enquiries ({leads.length})</span>
          </button>
        </div>

        {/* TAB 1: ROOM SHARING & MULTI-TIER PRICING (EXACT USER REQUIREMENT) */}
        {activeTab === 'pricing' && (
          <div className="tab-pane-content">
            <div className="section-title-wrap">
              <h2>Student Room Sharing Configurations &amp; Monthly Rent</h2>
              <p>Configure custom pricing per student for Single Rooms, Double Sharing, Triple Sharing, and 4-Student Dorms.</p>
            </div>

            <div className="pricing-tiers-grid">
              
              {/* Single Room (Private) */}
              <div className={`tier-card ${propertyData.roomTiers.single.enabled ? 'is-enabled' : 'is-disabled'}`}>
                <div className="tier-header">
                  <div className="tier-title-group">
                    <span className="tier-badge">Private</span>
                    <h3>Single Occupancy Room</h3>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={propertyData.roomTiers.single.enabled}
                      onChange={(e) => updateTier('single', 'enabled', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="tier-body">
                  <div className="tier-input-group">
                    <label>Monthly Rent Per Bed (₹)</label>
                    <div className="currency-input-wrap">
                      <span className="currency-prefix">₹</span>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.single.rent}
                        onChange={(e) => updateTier('single', 'rent', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.single.enabled}
                      />
                      <span className="currency-suffix">/mo</span>
                    </div>
                  </div>

                  <div className="tier-two-col">
                    <div className="tier-input-group">
                      <label>Total Capacity (Beds)</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.single.capacity}
                        onChange={(e) => updateTier('single', 'capacity', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.single.enabled}
                      />
                    </div>
                    <div className="tier-input-group">
                      <label>Occupied Beds</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.single.occupied}
                        onChange={(e) => updateTier('single', 'occupied', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.single.enabled}
                      />
                    </div>
                  </div>

                  <div className="tier-amenity-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={propertyData.roomTiers.single.hasAC}
                        onChange={(e) => updateTier('single', 'hasAC', e.target.checked)}
                        disabled={!propertyData.roomTiers.single.enabled}
                      />
                      <span>Air Conditioner Installed</span>
                    </label>
                  </div>
                </div>

                <div className="tier-vacant-badge">
                  <span>Available: {Math.max(0, propertyData.roomTiers.single.capacity - propertyData.roomTiers.single.occupied)} Vacancies</span>
                </div>
              </div>

              {/* Double Sharing (2 Students) */}
              <div className={`tier-card ${propertyData.roomTiers.double.enabled ? 'is-enabled' : 'is-disabled'}`}>
                <div className="tier-header">
                  <div className="tier-title-group">
                    <span className="tier-badge">2 Sharing</span>
                    <h3>Double Sharing Room</h3>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={propertyData.roomTiers.double.enabled}
                      onChange={(e) => updateTier('double', 'enabled', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="tier-body">
                  <div className="tier-input-group">
                    <label>Monthly Rent Per Student (₹)</label>
                    <div className="currency-input-wrap">
                      <span className="currency-prefix">₹</span>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.double.rent}
                        onChange={(e) => updateTier('double', 'rent', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.double.enabled}
                      />
                      <span className="currency-suffix">/mo</span>
                    </div>
                  </div>

                  <div className="tier-two-col">
                    <div className="tier-input-group">
                      <label>Total Capacity (Beds)</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.double.capacity}
                        onChange={(e) => updateTier('double', 'capacity', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.double.enabled}
                      />
                    </div>
                    <div className="tier-input-group">
                      <label>Occupied Beds</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.double.occupied}
                        onChange={(e) => updateTier('double', 'occupied', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.double.enabled}
                      />
                    </div>
                  </div>

                  <div className="tier-amenity-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={propertyData.roomTiers.double.hasAC}
                        onChange={(e) => updateTier('double', 'hasAC', e.target.checked)}
                        disabled={!propertyData.roomTiers.double.enabled}
                      />
                      <span>Air Conditioner Installed</span>
                    </label>
                  </div>
                </div>

                <div className="tier-vacant-badge">
                  <span>Available: {Math.max(0, propertyData.roomTiers.double.capacity - propertyData.roomTiers.double.occupied)} Vacancies</span>
                </div>
              </div>

              {/* Triple Sharing (3 Students) - Most Popular */}
              <div className={`tier-card popular-tier ${propertyData.roomTiers.triple.enabled ? 'is-enabled' : 'is-disabled'}`}>
                <div className="tier-popular-tag">MOST POPULAR STUDENT TIER</div>
                <div className="tier-header">
                  <div className="tier-title-group">
                    <span className="tier-badge highlight">3 Sharing</span>
                    <h3>Triple Sharing Room</h3>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={propertyData.roomTiers.triple.enabled}
                      onChange={(e) => updateTier('triple', 'enabled', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="tier-body">
                  <div className="tier-input-group">
                    <label>Monthly Rent Per Student (₹)</label>
                    <div className="currency-input-wrap">
                      <span className="currency-prefix">₹</span>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.triple.rent}
                        onChange={(e) => updateTier('triple', 'rent', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.triple.enabled}
                      />
                      <span className="currency-suffix">/mo</span>
                    </div>
                  </div>

                  <div className="tier-two-col">
                    <div className="tier-input-group">
                      <label>Total Capacity (Beds)</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.triple.capacity}
                        onChange={(e) => updateTier('triple', 'capacity', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.triple.enabled}
                      />
                    </div>
                    <div className="tier-input-group">
                      <label>Occupied Beds</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.triple.occupied}
                        onChange={(e) => updateTier('triple', 'occupied', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.triple.enabled}
                      />
                    </div>
                  </div>

                  <div className="tier-amenity-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={propertyData.roomTiers.triple.hasAC}
                        onChange={(e) => updateTier('triple', 'hasAC', e.target.checked)}
                        disabled={!propertyData.roomTiers.triple.enabled}
                      />
                      <span>Air Conditioner Installed</span>
                    </label>
                  </div>
                </div>

                <div className="tier-vacant-badge">
                  <span>Available: {Math.max(0, propertyData.roomTiers.triple.capacity - propertyData.roomTiers.triple.occupied)} Vacancies</span>
                </div>
              </div>

              {/* Four Sharing (4 Students) */}
              <div className={`tier-card ${propertyData.roomTiers.four.enabled ? 'is-enabled' : 'is-disabled'}`}>
                <div className="tier-header">
                  <div className="tier-title-group">
                    <span className="tier-badge">4 Sharing</span>
                    <h3>Four Student Dorm</h3>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={propertyData.roomTiers.four.enabled}
                      onChange={(e) => updateTier('four', 'enabled', e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="tier-body">
                  <div className="tier-input-group">
                    <label>Monthly Rent Per Student (₹)</label>
                    <div className="currency-input-wrap">
                      <span className="currency-prefix">₹</span>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.four.rent}
                        onChange={(e) => updateTier('four', 'rent', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.four.enabled}
                      />
                      <span className="currency-suffix">/mo</span>
                    </div>
                  </div>

                  <div className="tier-two-col">
                    <div className="tier-input-group">
                      <label>Total Capacity (Beds)</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.four.capacity}
                        onChange={(e) => updateTier('four', 'capacity', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.four.enabled}
                      />
                    </div>
                    <div className="tier-input-group">
                      <label>Occupied Beds</label>
                      <input 
                        type="number" 
                        value={propertyData.roomTiers.four.occupied}
                        onChange={(e) => updateTier('four', 'occupied', Number(e.target.value))}
                        disabled={!propertyData.roomTiers.four.enabled}
                      />
                    </div>
                  </div>

                  <div className="tier-amenity-row">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={propertyData.roomTiers.four.hasAC}
                        onChange={(e) => updateTier('four', 'hasAC', e.target.checked)}
                        disabled={!propertyData.roomTiers.four.enabled}
                      />
                      <span>Air Conditioner Installed</span>
                    </label>
                  </div>
                </div>

                <div className="tier-vacant-badge">
                  <span>Available: {Math.max(0, propertyData.roomTiers.four.capacity - propertyData.roomTiers.four.occupied)} Vacancies</span>
                </div>
              </div>

            </div>

            {/* Deposit & Food Add-on Policy Card */}
            <div className="policy-settings-card">
              <h3>Food Mess &amp; Security Deposit Settings</h3>
              <div className="policy-grid">
                
                <div className="policy-box">
                  <label className="form-label">Food / Mess Package</label>
                  <select 
                    className="policy-select"
                    value={propertyData.foodIncluded ? 'included' : 'optional'}
                    onChange={(e) => setPropertyData({ ...propertyData, foodIncluded: e.target.value === 'included' })}
                  >
                    <option value="included">Included in Monthly Rent (Zero Extra Charge)</option>
                    <option value="optional">Optional Add-On (+₹2,500/month)</option>
                  </select>
                </div>

                <div className="policy-box">
                  <label className="form-label">Mess Cuisine Standard</label>
                  <select 
                    className="policy-select"
                    value={propertyData.foodType}
                    onChange={(e) => setPropertyData({ ...propertyData, foodType: e.target.value })}
                  >
                    <option value="Pure Veg & Hygenic Mess">Pure Veg Home-Cooked Mess</option>
                    <option value="Veg & Non-Veg (Egg/Chicken)">Veg + Non-Veg (Twice Weekly)</option>
                    <option value="Jain & Pure Veg Available">Jain Food & Pure Veg</option>
                  </select>
                </div>

                <div className="policy-box">
                  <label className="form-label">Security Deposit Amount (₹)</label>
                  <div className="currency-input-wrap">
                    <span className="currency-prefix">₹</span>
                    <input 
                      type="number" 
                      value={propertyData.depositAmount}
                      onChange={(e) => setPropertyData({ ...propertyData, depositAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PG CENTRE PHOTOS & GALLERY (EXACT USER REQUIREMENT) */}
        {activeTab === 'photos' && (
          <div className="tab-pane-content">
            <div className="section-title-wrap">
              <h2>PG Centre Photo Gallery &amp; Room Showcases</h2>
              <p>Upload clean, high-resolution photos of your building exterior, sharing bedrooms, study tables, and attached washrooms.</p>
            </div>

            {/* Photo Upload Box */}
            <div className="photo-upload-section">
              <div className="upload-controls-row">
                
                {/* File Upload Button */}
                <label className="btn-file-upload">
                  <IconCamera className="w-4 h-4" />
                  <span>Choose Photo from Device</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Photo Tag Selector */}
                <select 
                  className="photo-tag-select"
                  value={newPhotoTag}
                  onChange={(e) => setNewPhotoTag(e.target.value)}
                >
                  <option value="Building Facade">Building Facade</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Double Sharing Room">Double Sharing Room</option>
                  <option value="Triple Sharing Room">Triple Sharing Room</option>
                  <option value="Attached Washroom">Attached Washroom</option>
                  <option value="Dining & Mess Area">Dining &amp; Mess Area</option>
                  <option value="Study Lounge">Study Lounge</option>
                </select>

                {/* Paste URL Option */}
                <form onSubmit={handleAddPhotoUrl} className="photo-url-form">
                  <input 
                    type="url" 
                    className="photo-url-input"
                    placeholder="Or paste direct image URL (https://...)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                  />
                  <button type="submit" className="btn-add-url">
                    <span>Add Photo</span>
                  </button>
                </form>

              </div>
            </div>

            {/* Gallery Grid */}
            <div className="photos-gallery-grid">
              {photos.map(photo => (
                <div key={photo.id} className={`photo-card ${photo.isCover ? 'is-cover' : ''}`}>
                  <img src={photo.url} alt={photo.tag} className="photo-img" />
                  
                  {photo.isCover && (
                    <span className="photo-cover-badge">★ MAIN COVER</span>
                  )}

                  <span className="photo-tag-badge">{photo.tag}</span>

                  <div className="photo-hover-actions">
                    {!photo.isCover && (
                      <button 
                        type="button" 
                        className="btn-set-cover"
                        onClick={() => handleSetCoverPhoto(photo.id)}
                      >
                        Set as Cover
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn-delete-photo"
                      onClick={() => handleDeletePhoto(photo.id)}
                      title="Remove Photo"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROPERTY DETAILS & CAMPUS ANCHOR */}
        {activeTab === 'property' && (
          <div className="tab-pane-content">
            <div className="section-title-wrap">
              <h2>Property Details &amp; College Anchor Distance</h2>
              <p>Keep your PG contact info and walking distance accurate to build trust with students and parents.</p>
            </div>

            <div className="property-edit-grid">
              <div className="form-group">
                <label className="form-label">Property Name</label>
                <input 
                  type="text" 
                  className="dash-text-input" 
                  value={propertyData.propertyName}
                  onChange={(e) => setPropertyData({ ...propertyData, propertyName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student Gender Category</label>
                <select 
                  className="dash-text-input"
                  value={propertyData.gender}
                  onChange={(e) => setPropertyData({ ...propertyData, gender: e.target.value })}
                >
                  <option value="Boys Only">Boys Only PG</option>
                  <option value="Girls Only">Girls Only PG</option>
                  <option value="Co-ed (Separate Wings)">Co-ed (Separate Wings)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pune Locality</label>
                <input 
                  type="text" 
                  className="dash-text-input" 
                  value={propertyData.area}
                  onChange={(e) => setPropertyData({ ...propertyData, area: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nearest Pune College Anchor</label>
                <input 
                  type="text" 
                  className="dash-text-input" 
                  value={propertyData.nearestCollege}
                  onChange={(e) => setPropertyData({ ...propertyData, nearestCollege: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gate-to-Door Distance (Meters)</label>
                <input 
                  type="number" 
                  className="dash-text-input" 
                  value={propertyData.walkingDistanceMeters}
                  onChange={(e) => setPropertyData({ ...propertyData, walkingDistanceMeters: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Walking Time (Minutes)</label>
                <input 
                  type="number" 
                  className="dash-text-input" 
                  value={propertyData.walkingTimeMinutes}
                  onChange={(e) => setPropertyData({ ...propertyData, walkingTimeMinutes: Number(e.target.value) })}
                />
              </div>

              <div className="form-group form-col-full">
                <label className="form-label">Full Address with Landmark</label>
                <input 
                  type="text" 
                  className="dash-text-input" 
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AMENITIES */}
        {activeTab === 'amenities' && (
          <div className="tab-pane-content">
            <div className="section-title-wrap">
              <h2>Amenities &amp; Student Living Facilities</h2>
              <p>Toggle the amenities provided at your PG centre. Verified amenities appear as highlight badges on your student card.</p>
            </div>

            <div className="amenities-toggle-grid">
              {Object.entries({
                wifi: 'High-Speed 100 Mbps Wi-Fi',
                powerBackup: '24/7 Inverter Power Backup',
                roWater: 'RO Purified Drinking Water',
                cleaning: 'Daily Room & Washroom Cleaning',
                cctv: '24/7 CCTV & Security Guard',
                geyser: 'Hot Water Geyser in Washrooms',
                washingMachine: 'Fully Automatic Washing Machine',
                airConditioner: 'Air Conditioning Options',
                studyTable: 'Personal Study Table & Wardrobe',
                biometricGate: 'Biometric Gate Access (No Curfew Dispute)'
              }).map(([key, label]) => (
                <div 
                  key={key} 
                  className={`amenity-toggle-card ${propertyData.amenities[key] ? 'active-amenity' : ''}`}
                  onClick={() => toggleAmenity(key)}
                >
                  <div className="amenity-check-box">
                    {propertyData.amenities[key] && <IconCheck className="w-4 h-4 text-emerald" />}
                  </div>
                  <span className="amenity-title">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT LEADS & INQUIRIES */}
        {activeTab === 'leads' && (
          <div className="tab-pane-content">
            <div className="section-title-wrap">
              <h2>Student Enquiries &amp; Visit Bookings</h2>
              <p>Connect directly with students admitted to nearby colleges looking for accommodation.</p>
            </div>

            <div className="leads-list-table">
              {leads.map(lead => (
                <div key={lead.id} className="lead-row-card">
                  <div className="lead-student-info">
                    <span className="lead-name">{lead.studentName}</span>
                    <span className="lead-college">🎓 {lead.college}</span>
                    <span className="lead-sharing">🛏️ Requested: <strong>{lead.sharing}</strong></span>
                  </div>

                  <div className="lead-date-box">
                    <span className="lead-date">Enquired on {lead.date}</span>
                    <span className={`lead-status-pill ${lead.status === 'Confirmed' ? 'pill-confirmed' : 'pill-pending'}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="lead-actions-cluster">
                    <a href={`tel:${lead.phone}`} className="btn-lead-call">
                      <span>📞 {lead.phone}</span>
                    </a>
                    
                    {lead.status !== 'Confirmed' ? (
                      <button 
                        type="button" 
                        className="btn-lead-approve"
                        onClick={() => updateLeadStatus(lead.id, 'Confirmed')}
                      >
                        ✓ Reserve Bed
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-lead-cancel"
                        onClick={() => updateLeadStatus(lead.id, 'Pending Review')}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating Bottom Sticky Bar */}
        <div className="owner-bottom-bar">
          <div className="bottom-bar-info">
            <span className="bottom-save-hint">Make changes and hit save to update your live student card</span>
          </div>
          <button 
            type="button" 
            className="btn-save-master"
            onClick={handleSaveAll}
          >
            <IconCheck className="w-4 h-4" />
            <span>Save &amp; Update Live Listing</span>
          </button>
        </div>

      </div>
    </div>
  );
}
