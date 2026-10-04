import { motion } from 'motion/react';
import { TRUST_POINTS } from '../data/mockData';
import { 
  IconMapPin, 
  IconLayers, 
  IconGraduationCap, 
  IconShield 
} from './Icons';
import './TrustValueStrip.css';

export default function TrustValueStrip() {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'navigation':
        return <IconMapPin className="trust-icon" />;
      case 'layers':
        return <IconLayers className="trust-icon" />;
      case 'graduation-cap':
        return <IconGraduationCap className="trust-icon" />;
      case 'check-circle-2':
        return <IconShield className="trust-icon" />;
      default:
        return <IconMapPin className="trust-icon" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="trust-strip-section" aria-label="Why CampusNest for Students">
      <div className="container">
        {/* Subtle Section Header */}
        <div className="trust-strip-header">
          <span className="trust-label-badge">WHY CAMPUSNEST</span>
          <h2 className="trust-headline">Built from the ground up for students moving to a new city</h2>
          <p className="trust-sub">Traditional rental portals focus on family apartments and commission brokers. We focus exclusively on student academic life.</p>
        </div>

        {/* 4 Trust Value Cards */}
        <motion.div 
          className="trust-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {TRUST_POINTS.map((point) => (
            <motion.div 
              key={point.id} 
              className="trust-card"
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="trust-card-top">
                <div className="trust-icon-box">
                  {getIcon(point.icon)}
                </div>
                <div className="trust-metric-pill">
                  <span className="metric-val">{point.metric}</span>
                </div>
              </div>

              <h3 className="trust-card-title">{point.title}</h3>
              <span className="trust-card-tagline">{point.tagline}</span>
              <p className="trust-card-desc">{point.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Micro Guarantee Banner */}
        <div className="trust-banner-strip">
          <div className="guarantee-item">
            <span className="check-dot">✓</span>
            <span>No Fake Listings or Ghost Landlords</span>
          </div>
          <div className="guarantee-item">
            <span className="check-dot">✓</span>
            <span>Genuine Walk Times from College Gates</span>
          </div>
          <div className="guarantee-item">
            <span className="check-dot">✓</span>
            <span>100% Student-Friendly Lease Conditions</span>
          </div>
        </div>
      </div>
    </section>
  );
}
