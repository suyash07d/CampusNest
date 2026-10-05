import { motion } from 'motion/react';
import './AdminShell.css';

/**
 * Premium Admin Metric Stat Card with smooth hover effects,
 * vibrant glow accents, and optional click interaction.
 */
export default function AdminMetricCard({
  title,
  value,
  sublabel,
  icon: Icon,
  color = 'indigo',
  badge,
  onClick,
  index = 0,
}) {
  const isClickable = Boolean(onClick);

  return (
    <motion.div
      className={`admin-metric-card color-${color} ${isClickable ? 'clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={isClickable ? { y: -3, transition: { duration: 0.2 } } : undefined}
    >
      <div className="metric-card-top">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className={`metric-icon-bubble bubble-${color}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="metric-card-body">
        <span className="metric-number">
          {typeof value === 'number' ? value.toLocaleString() : (value ?? 0)}
        </span>
        {badge && <span className="metric-badge">{badge}</span>}
      </div>

      {sublabel && (
        <div className="metric-sublabel">
          <span>{sublabel}</span>
          {isClickable && <span className="metric-action-arrow">→</span>}
        </div>
      )}
    </motion.div>
  );
}
