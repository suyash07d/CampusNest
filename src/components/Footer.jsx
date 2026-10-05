import { motion } from 'motion/react';
import { IconGraduationCap, IconShield, IconMail, IconSparkles } from './Icons';
import './Footer.css';

export default function Footer({ onOpenOwnerModal, onOpenAuth, onOpenAdmin }) {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="site-footer" aria-label="CampusNest Footer">
      <div className="container">
        {/* Navigation & Hubs Grid */}
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="footer-brand-icon">
                <IconGraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="footer-brand-name">Campus<span>Nest</span></span>
            </div>
            <p className="footer-mission">
              The student-first accommodation discovery platform. 
              Helping students find verified, walkable PGs near their university gates across India.
            </p>
            <div className="footer-safe-badge">
              <IconShield className="w-4 h-4 text-emerald" />
              <span>100% Student-Focused • Zero Hidden Fees</span>
            </div>
          </div>

          {/* Educational Hubs */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Educational Hubs</h4>
            <ul className="footer-links-list">
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Pune (Pimpri, Wakad, Kothrud)</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Bengaluru (Koramangala, HSR)</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Delhi NCR (North & South Campus)</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Mumbai (Vile Parle, Powai)</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Kota Coaching Hub</a></li>
            </ul>
          </div>

          {/* Student Resources */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Student Discovery</h4>
            <ul className="footer-links-list">
              <li><a href="#how-it-works" onClick={() => handleScrollTo('how-it-works')}>How it works</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Girls-Only Hostels</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Boys-Only Residencies</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Co-Living Spaces</a></li>
              <li><a href="#discovery" onClick={() => handleScrollTo('discovery')}>Walking Distance Filter</a></li>
            </ul>
          </div>

          {/* For Property Owners & Quick Access */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">For Hosts & Access</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" className="footer-text-btn" onClick={onOpenOwnerModal}>
                  List Your Property
                </button>
              </li>
              <li>
                <button type="button" className="footer-text-btn" onClick={onOpenAuth}>
                  Student / Host Login
                </button>
              </li>
              <li>
                <button type="button" className="footer-text-btn text-indigo-subtle" onClick={onOpenAdmin}>
                  Admin Gateway
                </button>
              </li>
              <li><a href="#owners" onClick={() => handleScrollTo('owners')}>Host Verification Standards</a></li>
              <li><a href="#owners" onClick={() => handleScrollTo('owners')}>Zero Commission Program</a></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Strip */}
        <div className="footer-disclaimer-strip">
          <p>
            <strong>Note & Disclaimer:</strong> CampusNest is a specialized student housing discovery platform. 
            All accommodation profiles, distances, and amenities shown on this preview interface are representative 
            demonstration models designed to showcase our upcoming verified marketplace for the 2026 academic admissions intake.
          </p>
        </div>

        {/* PREMIUM FOUNDER & OWNER SIGNATURE SHOWCASE */}
        <motion.div 
          className="footer-founder-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient Glow Backdrop */}
          <div className="founder-glow-backdrop" aria-hidden="true" />

          <div className="founder-card-content">
            <div className="founder-badge">
              <IconSparkles className="founder-sparkle-icon" />
              <span>FOUNDED & BUILT BY</span>
            </div>

            <h3 className="founder-name">
              Suyash Gajanan Dhengle
            </h3>

            <div className="founder-contact-wrap">
              <span className="founder-contact-label">For any query, contact the site owner</span>
              <a 
                href="mailto:suyashdhengle540@gmail.com" 
                className="founder-email-badge"
                title="Send email to Suyash Gajanan Dhengle"
              >
                <div className="founder-email-icon-box">
                  <IconMail className="founder-mail-icon" />
                </div>
                <span className="founder-email-text">suyashdhengle540@gmail.com</span>
              </a>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} CampusNest Technologies Inc. Built for students moving to a new city.
          </p>
          <div className="footer-social-meta">
            <span>Privacy Policy</span>
            <span className="dot-sep">•</span>
            <span>Terms of Service</span>
            <span className="dot-sep">•</span>
            <span>Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
