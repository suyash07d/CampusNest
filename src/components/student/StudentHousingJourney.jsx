import { motion } from 'motion/react';
import { 
  IconGraduationCap, 
  IconHeart, 
  IconMail, 
  IconKey, 
  IconCheck, 
  IconArrowRight, 
  IconSparkles,
  IconClock
} from '../Icons';

export default function StudentHousingJourney({
  college,
  favouritesCount = 0,
  enquiriesCount = 0,
  onNavigateTab,
}) {
  // Determine current stage & completion
  const stage1Complete = Boolean(college?.id || college?.slug);
  const stage2Complete = favouritesCount > 0;
  const stage3Complete = enquiriesCount > 0;
  // Stage 4 is active when student has both favourites and enquiries
  const stage4Complete = stage2Complete && stage3Complete;

  const completedCount = [stage1Complete, stage2Complete, stage3Complete, stage4Complete].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  const stages = [
    {
      id: 'anchor',
      num: '01',
      title: 'Campus Anchor',
      subtitle: stage1Complete ? (college?.shortName || college?.name) : 'Pick your university',
      icon: IconGraduationCap,
      isDone: stage1Complete,
      targetTab: 'profile',
      actionLabel: stage1Complete ? 'Change' : 'Select',
      accentColor: 'indigo',
    },
    {
      id: 'shortlist',
      num: '02',
      title: 'Shortlist PGs',
      subtitle: stage2Complete ? `${favouritesCount} PG${favouritesCount > 1 ? 's' : ''} saved` : 'Explore walking PGs',
      icon: IconHeart,
      isDone: stage2Complete,
      targetTab: stage2Complete ? 'saved' : 'discover',
      actionLabel: stage2Complete ? 'View' : 'Explore',
      accentColor: 'rose',
    },
    {
      id: 'enquire',
      num: '03',
      title: 'Connect & Visit',
      subtitle: stage3Complete ? `${enquiriesCount} enquiry sent` : 'Contact verified hosts',
      icon: IconMail,
      isDone: stage3Complete,
      targetTab: stage3Complete ? 'enquiries' : 'saved',
      actionLabel: stage3Complete ? 'Status' : 'Enquire',
      accentColor: 'amber',
    },
    {
      id: 'lease',
      num: '04',
      title: 'Move In Secure',
      subtitle: stage4Complete ? 'Zero brokerage ready' : 'Direct host verification',
      icon: IconKey,
      isDone: stage4Complete,
      targetTab: 'discover',
      actionLabel: 'Discover',
      accentColor: 'emerald',
    },
  ];

  return (
    <section className="student-journey-card" aria-labelledby="journey-heading">
      {/* Background ambient lighting */}
      <div className="journey-bg-glow" aria-hidden="true" />

      {/* Header */}
      <div className="journey-card-header">
        <div className="journey-header-main">
          <div className="journey-icon-chip">
            <IconSparkles className="w-4 h-4 text-indigo" />
          </div>
          <div>
            <div className="journey-eyebrow">STUDENT ONBOARDING PIPELINE</div>
            <h2 id="journey-heading" className="journey-title">Your Housing Journey</h2>
          </div>
        </div>

        {/* Live Progress Pill */}
        <div className="journey-progress-indicator">
          <div className="progress-badge">
            <span className="progress-value">{progressPercent}%</span>
            <span className="progress-caption">Completed</span>
          </div>
          <div className="progress-bar-track">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* 4-Stage Horizontal Pipeline Grid */}
      <div className="journey-stages-grid">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isNextPending = !stage.isDone && (idx === 0 || stages[idx - 1].isDone);

          return (
            <motion.div 
              key={stage.id}
              className={`journey-step-card ${stage.isDone ? 'is-complete' : ''} ${isNextPending ? 'is-active-step' : ''}`}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
            >
              {/* Connector line between steps */}
              {idx < stages.length - 1 && (
                <div 
                  className={`journey-step-connector ${stage.isDone ? 'connector-filled' : ''}`} 
                  aria-hidden="true"
                />
              )}

              <div className="step-top-row">
                <span className="step-index-pill">{stage.num}</span>
                <div className={`step-status-pill ${stage.isDone ? 'done' : isNextPending ? 'active' : 'idle'}`}>
                  {stage.isDone ? (
                    <><IconCheck className="w-3.5 h-3.5 text-emerald" /><span>Done</span></>
                  ) : isNextPending ? (
                    <><IconClock className="w-3.5 h-3.5 text-amber is-pulsing" /><span>Next step</span></>
                  ) : (
                    <span>Pending</span>
                  )}
                </div>
              </div>

              <div className={`step-icon-bubble bg-${stage.accentColor}-bubble`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="step-info-block">
                <h3 className="step-title">{stage.title}</h3>
                <p className="step-subtitle" title={stage.subtitle}>{stage.subtitle}</p>
              </div>

              <button
                type="button"
                className={`step-action-btn ${stage.isDone ? 'btn-done' : isNextPending ? 'btn-active' : 'btn-idle'}`}
                onClick={() => onNavigateTab && onNavigateTab(stage.targetTab)}
              >
                <span>{stage.actionLabel}</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
