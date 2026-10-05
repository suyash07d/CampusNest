import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX } from '../Icons';
import './AdminShell.css';

export default function AdminDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  tabs = [],
  activeTab,
  onTabChange,
  children,
  footerActions,
  maxWidth = '840px',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
        <motion.div
          className="admin-detail-modal-card"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="modal-header">
            <div className="modal-title-stack">
              <div className="modal-title-row">
                <h3 className="modal-title">{title}</h3>
                {badge && <span className="modal-badge">{badge}</span>}
              </div>
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs Navigation if provided */}
          {tabs.length > 0 && (
            <div className="modal-tabs-bar">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`modal-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange?.(tab.id)}
                  >
                    {TabIcon && <TabIcon className="w-4 h-4" />}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="modal-tab-count">{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Scrollable Body Content */}
          <div className="modal-scroll-body">
            {children}
          </div>

          {/* Modal Footer Actions if provided */}
          {footerActions && (
            <div className="modal-footer">
              {footerActions}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
