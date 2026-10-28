import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PUNE_COLLEGES, PUNE_AREAS } from '../../data/puneDiscoveryData';
import { 
  IconGraduationCap, 
  IconCompass, 
  IconMapPin, 
  IconClock, 
  IconArrowRight, 
  IconShield,
  IconSparkles,
  IconBuilding
} from '../Icons';

const RADAR_ZONES = [
  { min: 5, dist: '400m', label: 'Prime Campus Perimeter', pgs: '8-12 Verified PGs', color: '#10B981' },
  { min: 10, dist: '800m', label: 'Walking Student Corridor', pgs: '15-20 Verified PGs', color: '#6366F1' },
  { min: 15, dist: '1.2km', label: 'Suburban Transit Ring', pgs: '25+ Verified PGs', color: '#F59E0B' },
];

export default function StudentCampusRadar({
  currentCollege,
  onSelectTab,
  onBrowsePGs,
}) {
  const [selectedZone, setSelectedZone] = useState(10); // default 10 min

  const currentArea = useMemo(() => {
    if (!currentCollege?.areaSlug) return null;
    return PUNE_AREAS.find(a => a.slug === currentCollege.areaSlug) || null;
  }, [currentCollege]);

  // Featured alternative colleges in the same area
  const peerColleges = useMemo(() => {
    if (!currentCollege?.areaSlug) {
      return PUNE_COLLEGES.slice(0, 4);
    }
    return PUNE_COLLEGES.filter(c => c.id !== currentCollege.id && c.areaSlug === currentCollege.areaSlug).slice(0, 3);
  }, [currentCollege]);

  const collegeName = currentCollege?.shortName || currentCollege?.name || 'Pune University Campus';
  const areaName = currentArea?.name || currentCollege?.areaName || 'Pune Central';

  return (
    <section className="student-campus-radar-card" aria-labelledby="campus-radar-heading">
      <div className="radar-card-glow" aria-hidden="true" />

      {/* Card Header */}
      <div className="radar-header">
        <div className="radar-header-left">
          <div className="radar-icon-badge">
            <IconCompass className="w-5 h-5 text-emerald" />
          </div>
          <div>
            <div className="radar-eyebrow">WALKING DISTANCE RADAR</div>
            <h2 id="campus-radar-heading" className="radar-title">Honest Walking Minutes</h2>
          </div>
        </div>

        <div className="radar-header-right">
          <button 
            type="button" 
            className="radar-switch-anchor-btn"
            onClick={() => onSelectTab && onSelectTab('discover')}
          >
            <IconGraduationCap className="w-4 h-4 text-indigo" />
            <span>Switch Campus</span>
          </button>
        </div>
      </div>

      {/* Main Radar Layout: Graphic on Left, Specs on Right */}
      <div className="radar-body-grid">
        {/* Graphical SVG Concentric Radar */}
        <div className="radar-graphic-container">
          <div className="radar-rings-stage">
            <svg viewBox="0 0 320 320" className="radar-svg-canvas" aria-hidden="true">
              {/* Outer grid circles */}
              <circle cx="160" cy="160" r="145" className="radar-ring ring-outer" />
              <circle cx="160" cy="160" r="105" className="radar-ring ring-middle" />
              <circle cx="160" cy="160" r="65" className="radar-ring ring-inner" />

              {/* Crosshair guide lines */}
              <line x1="160" y1="15" x2="160" y2="305" className="radar-crosshair" />
              <line x1="15" y1="160" x2="305" y2="160" className="radar-crosshair" />

              {/* Sweeping scan animation beam */}
              <g className="radar-sweep-group">
                <circle cx="160" cy="160" r="145" className="radar-sweep-beam" />
              </g>

              {/* Distance Labels in SVG */}
              <text x="165" y="90" className="radar-text-label">5 min</text>
              <text x="165" y="50" className="radar-text-label">10 min</text>
              <text x="165" y="18" className="radar-text-label">15 min</text>

              {/* PG Hotspot Pins around campus */}
              <circle cx="140" cy="120" r="4.5" className="radar-pin-dot pin-emerald" />
              <circle cx="185" cy="135" r="4" className="radar-pin-dot pin-indigo" />
              <circle cx="120" cy="190" r="4" className="radar-pin-dot pin-indigo" />
              <circle cx="215" cy="195" r="5" className="radar-pin-dot pin-amber" />
              <circle cx="190" cy="80" r="4.5" className="radar-pin-dot pin-amber" />
              <circle cx="85" cy="140" r="4" className="radar-pin-dot pin-amber" />

              {/* Center Campus Anchor Icon Pin */}
              <circle cx="160" cy="160" r="16" className="radar-center-beacon-outer" />
              <circle cx="160" cy="160" r="10" className="radar-center-beacon-inner" />
            </svg>

            {/* Overlay Center Campus Badge */}
            <div className="radar-center-badge">
              <IconGraduationCap className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="radar-caption-strip">
            <span className="radar-pulse-dot" />
            <span className="radar-caption-text">
              Anchor: <strong>{collegeName}</strong> ({areaName})
            </span>
          </div>
        </div>

        {/* Right Info & Interactive Zone Controls */}
        <div className="radar-details-container">
          <div className="radar-detail-headline">
            <h3 className="radar-zone-heading">Select Walking Threshold</h3>
            <p className="radar-zone-sub">
              Never pay extra for fake walking claims. Every listing on CampusNest is verified with on-foot pedestrian routes.
            </p>
          </div>

          {/* Interactive Zone Buttons */}
          <div className="radar-zones-list">
            {RADAR_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.min;
              return (
                <button
                  key={zone.min}
                  type="button"
                  className={`radar-zone-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedZone(zone.min)}
                >
                  <div className="zone-item-left">
                    <div className="zone-time-pill" style={{ borderColor: isSelected ? zone.color : 'rgba(255,255,255,0.1)' }}>
                      <IconClock className="w-3.5 h-3.5" style={{ color: zone.color }} />
                      <span>&le; {zone.min} min</span>
                    </div>
                    <div>
                      <div className="zone-title">{zone.label}</div>
                      <div className="zone-dist">Within {zone.dist} radius</div>
                    </div>
                  </div>
                  <div className="zone-badge-pill">
                    <span>{zone.pgs}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Action Bar */}
          <div className="radar-action-footer">
            <button
              type="button"
              className="btn-radar-browse"
              onClick={() => onBrowsePGs ? onBrowsePGs() : onSelectTab && onSelectTab('discover')}
            >
              <IconCompass className="w-4 h-4" />
              <span>Explore PGs within {selectedZone} Mins</span>
              <IconArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
