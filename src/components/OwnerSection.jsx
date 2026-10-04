import { motion } from 'motion/react';
import { OWNER_BENEFITS } from '../data/mockData';
import { 
  IconBuilding, 
  IconCheck, 
  IconGraduationCap, 
  IconArrowRight, 
  IconShield 
} from './Icons';
import './OwnerSection.css';

export default function OwnerSection({ onOpenOwnerModal }) {
  return (
    <section id="owners" className="owner-section" aria-label="For PG Owners and Property Hosts">
      <div className="container">
        <motion.div 
          className="owner-card-hero"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background Ambient Glow */}
          <div className="owner-glow" aria-hidden="true" />

          <div className="owner-grid">
            {/* Left Content Column */}
            <div className="owner-info-col">
              <div className="owner-pill-badge">
                <IconBuilding className="w-3.5 h-3.5 text-accent" />
                <span>FOR PG OWNERS & HOSTS</span>
              </div>

              <h2 className="owner-main-headline">
                Have a PG?
              </h2>

              <p className="owner-sub-lead">
                List your property and reach students looking for a place near their college.
              </p>

              <p className="owner-description">
                Say goodbye to random brokers taking cuts. Connect directly with students enrolled 
                in colleges right across your street. Fill vacancies before the academic semester begins.
              </p>

              {/* 3 Key Benefits */}
              <div className="owner-benefits-list">
                {OWNER_BENEFITS.map((benefit, i) => (
                  <div key={i} className="owner-benefit-item">
                    <div className="benefit-icon-badge">
                      <IconCheck className="w-4 h-4 text-emerald" />
                    </div>
                    <div className="benefit-text">
                      <strong>{benefit.title}</strong>
                      <p>{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Action */}
              <div className="owner-cta-group">
                <button
                  type="button"
                  className="btn-list-pg"
                  onClick={onOpenOwnerModal}
                >
                  <span>List your PG</span>
                  <IconArrowRight className="btn-icon-right" />
                </button>
                <span className="owner-zero-fee-note">
                  ✓ Free onboarding for 2026 Academic Season
                </span>
              </div>
            </div>

            {/* Right Visual Simulation Column */}
            <div className="owner-visual-col">
              <div className="owner-preview-widget">
                <div className="widget-header">
                  <div className="widget-status-dot" />
                  <span className="widget-status-text">Owner Host Network</span>
                </div>

                <div className="widget-stat-card">
                  <span className="stat-label">Students Searching in Pune & Bengaluru</span>
                  <div className="stat-number">12,400+</div>
                  <div className="stat-progress-bar">
                    <div className="stat-progress-fill" style={{ width: '84%' }} />
                  </div>
                  <span className="stat-footnote">84% students prefer PGs within 800m of college</span>
                </div>

                <div className="widget-tenant-mock">
                  <div className="tenant-mock-avatar">
                    <IconGraduationCap className="w-5 h-5 text-indigo" />
                  </div>
                  <div className="tenant-mock-text">
                    <strong>B.Tech / Medical Fresher Admitted</strong>
                    <span>Looking for 2-sharing room with food mess</span>
                  </div>
                  <span className="tenant-badge">Matched</span>
                </div>

                <div className="widget-host-guarantee">
                  <IconShield className="w-4 h-4 text-emerald" />
                  <span>Verified College Student Tenants Only</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
