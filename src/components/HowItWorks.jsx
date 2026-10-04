import { motion } from 'motion/react';
import { HOW_IT_WORKS_STEPS } from '../data/mockData';
import { 
  IconMapPin, 
  IconGraduationCap, 
  IconCheck, 
  IconArrowRight 
} from './Icons';
import './HowItWorks.css';

export default function HowItWorks({ onGetStarted }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const stepCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="how-it-works" className="how-it-works-section" aria-label="How CampusNest Works">
      <div className="container">
        {/* Section Header */}
        <div className="how-header text-center">
          <div className="how-badge">
            <span className="how-badge-text">THREE SIMPLE STEPS</span>
          </div>
          <h2 className="how-headline">How CampusNest Works for Students</h2>
          <p className="how-subtext">
            Moving to a new city for your degree is stressful enough. 
            Finding the right room near your lecture halls shouldn’t be a gamble.
          </p>
        </div>

        {/* 3 Interactive Steps */}
        <motion.div 
          className="how-steps-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <motion.div 
              key={step.step} 
              className="how-step-card"
              variants={stepCardVariants}
            >
              <div className="step-card-header">
                <span className="step-number">{step.step}</span>
                <span className="step-pill">{step.badge}</span>
              </div>

              {/* Visual simulation box for each step */}
              <div className="step-visual-mock">
                {idx === 0 && (
                  <div className="mock-step-1">
                    <div className="mock-tag-row">
                      <span className="mock-tag active">Pune</span>
                      <span className="mock-tag">Bengaluru</span>
                      <span className="mock-tag">Delhi NCR</span>
                    </div>
                    <div className="mock-city-preview">
                      <IconMapPin className="mock-pin-icon" />
                      <span>480+ Student Verified PGs in Pune</span>
                    </div>
                  </div>
                )}

                {idx === 1 && (
                  <div className="mock-step-2">
                    <div className="mock-college-card">
                      <IconGraduationCap className="mock-grad-icon" />
                      <div className="mock-college-info">
                        <strong>DY Patil Institute of Tech</strong>
                        <span>Campus Gate 1 • Walking Radius 500m</span>
                      </div>
                    </div>
                    <div className="mock-dist-badge">
                      <span>✓ Gate distance mapped</span>
                    </div>
                  </div>
                )}

                {idx === 2 && (
                  <div className="mock-step-3">
                    <div className="mock-pg-result">
                      <div className="result-indicator" />
                      <div className="result-text">
                        <strong>Triple & Double Sharing</strong>
                        <span>₹8,500/mo • 3 Meals Mess Included</span>
                      </div>
                    </div>
                    <div className="mock-guarantee-pill">
                      <IconCheck className="w-3.5 h-3.5 text-emerald" />
                      <span>Zero Brokerage</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="step-card-body">
                <h3 className="step-title">{step.title}</h3>
                <h4 className="step-subtitle">{step.subtitle}</h4>
                <p className="step-description">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA Bar */}
        <div className="how-cta-banner">
          <div className="banner-left">
            <h3>Ready to explore accommodations near your college?</h3>
            <p>Start with your city and select your campus gate in under 30 seconds.</p>
          </div>
          <button 
            type="button" 
            className="btn-start-search"
            onClick={() => {
              if (onGetStarted) onGetStarted();
              else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <span>Start Campus Search</span>
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
