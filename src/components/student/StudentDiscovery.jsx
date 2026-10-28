import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PUNE_COLLEGES, PUNE_AREAS } from '../../data/puneDiscoveryData';
import { 
  IconSearch, 
  IconGraduationCap, 
  IconMapPin, 
  IconCheck, 
  IconArrowRight, 
  IconExternalLink,
  IconSparkles
} from '../Icons';

const STREAM_TABS = [
  { id: 'all', label: 'All Streams' },
  { id: 'Engineering', label: 'Engineering' },
  { id: 'Management', label: 'Management' },
  { id: 'Science', label: 'Arts & Science' },
  { id: 'Commerce', label: 'Commerce' },
  { id: 'Law', label: 'Law' },
  { id: 'Medical', label: 'Medical' },
];

export default function StudentDiscovery({
  currentCollege,
  onAnchorCollege,
  onBrowsePGs,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState('all');
  const [anchoringId, setAnchoringId] = useState(null);

  const filteredColleges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PUNE_COLLEGES.filter((c) => {
      // Stream filter
      if (selectedStream !== 'all') {
        const matchesStream = c.categories.some((cat) =>
          cat.toLowerCase().includes(selectedStream.toLowerCase())
        );
        if (!matchesStream) return false;
      }

      // Query filter
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchShort = c.shortName.toLowerCase().includes(q);
        const matchSlug = c.slug.toLowerCase().includes(q);
        const matchAliases = c.aliases?.some((a) => a.toLowerCase().includes(q));
        const matchArea = c.areaSlug.toLowerCase().includes(q);
        return matchName || matchShort || matchSlug || matchAliases || matchArea;
      }

      return true;
    });
  }, [searchQuery, selectedStream]);

  const handleAnchor = async (college) => {
    if (onAnchorCollege) {
      setAnchoringId(college.id);
      try {
        await onAnchorCollege(college);
      } finally {
        setAnchoringId(null);
      }
    }
  };

  return (
    <div className="student-discovery-view">
      {/* Discovery Header Banner */}
      <div className="discovery-hero-card">
        <div className="discovery-hero-header">
          <div className="discovery-icon-wrapper">
            <IconGraduationCap className="w-6 h-6 text-indigo" />
          </div>
          <div>
            <h2 className="discovery-heading">Pune Campus & PG Radar</h2>
            <p className="discovery-subheading">
              Select your college campus to calculate accurate walking minutes to nearby student PGs.
            </p>
          </div>
        </div>

        {/* Global Discovery Trigger */}
        {onBrowsePGs && (
          <div className="discovery-cta-bar">
            <span>Ready to explore all verified Pune student hostels with live filters?</span>
            <button 
              type="button" 
              className="btn-launch-discovery"
              onClick={onBrowsePGs}
            >
              <span>Open Public PG Radar</span>
              <IconExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="discovery-filter-toolbar">
        <div className="discovery-search-box">
          <IconSearch className="discovery-search-icon" />
          <input
            type="text"
            className="discovery-search-input"
            placeholder="Search college name, short code (COEP, MIT-WPU, PCCOE, DY Patil)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="discovery-stream-pills">
          {STREAM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`stream-pill-btn ${selectedStream === tab.id ? 'is-active' : ''}`}
              onClick={() => setSelectedStream(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Strip */}
      <div className="discovery-results-meta">
        <span>Showing <strong>{filteredColleges.length}</strong> verified Pune institutes</span>
        {currentCollege && (
          <span className="current-anchor-badge">
            Current Anchor: <strong>{currentCollege.shortName || currentCollege.name}</strong>
          </span>
        )}
      </div>

      {/* College Cards Grid */}
      <div className="discovery-colleges-grid">
        <AnimatePresence mode="popLayout">
          {filteredColleges.map((college, idx) => {
            const isAnchored = currentCollege?.id === college.id || currentCollege?.slug === college.slug;
            const areaInfo = PUNE_AREAS.find((a) => a.slug === college.areaSlug);

            return (
              <motion.article
                key={college.id || college.slug}
                className={`discovery-college-card ${isAnchored ? 'is-anchored' : ''}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
              >
                <div className="card-header-badge-row">
                  <span className="badge-college-acronym">{college.shortName}</span>
                  <span className="badge-college-area">
                    <IconMapPin className="w-3 h-3" />
                    <span>{areaInfo?.name || college.areaSlug}</span>
                  </span>
                </div>

                <h3 className="card-college-fullname">{college.name}</h3>

                <p className="card-college-affiliation">
                  {college.affiliation || 'SPPU Recognized Institute'}
                </p>

                <div className="card-streams-row">
                  {college.categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="stream-badge">{cat}</span>
                  ))}
                  {college.categories.length > 3 && (
                    <span className="stream-badge more">+{college.categories.length - 3}</span>
                  )}
                </div>

                <div className="card-action-footer">
                  <button
                    type="button"
                    className={`btn-set-anchor ${isAnchored ? 'is-current' : ''}`}
                    onClick={() => handleAnchor(college)}
                    disabled={isAnchored || anchoringId === college.id}
                  >
                    {isAnchored ? (
                      <>
                        <IconCheck className="w-3.5 h-3.5 text-emerald" />
                        <span>Current Campus</span>
                      </>
                    ) : anchoringId === college.id ? (
                      <span>Saving Anchor...</span>
                    ) : (
                      <>
                        <IconSparkles className="w-3.5 h-3.5" />
                        <span>Set as My Campus</span>
                      </>
                    )}
                  </button>

                  {onBrowsePGs && (
                    <button
                      type="button"
                      className="btn-explore-pgs-link"
                      onClick={onBrowsePGs}
                      title="Explore PGs near this campus"
                    >
                      <span>Explore PGs</span>
                      <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
