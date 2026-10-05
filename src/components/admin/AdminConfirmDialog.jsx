import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconAlertTriangle, IconCheckCircle, IconX, IconSpinner } from '../Icons';
import './AdminShell.css';

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this administrative action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
  notesPlaceholder = 'Optional administrative audit notes...',
  requireNotes = false,
}) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setNotes('');
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (requireNotes && !notes.trim()) {
      setError('Audit notes are required for this moderation action.');
      return;
    }
    setError(null);
    await onConfirm(notes.trim());
    setNotes('');
  };

  return (
    <AnimatePresence>
      <div className="admin-modal-backdrop" onClick={handleClose} role="presentation">
        <motion.div
          className="admin-dialog-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="dialog-header">
            <div className={`dialog-icon-bubble ${isDestructive ? 'bubble-rose' : 'bubble-indigo'}`}>
              {isDestructive ? (
                <IconAlertTriangle className="w-5 h-5 text-rose" />
              ) : (
                <IconCheckCircle className="w-5 h-5 text-indigo" />
              )}
            </div>
            <div className="dialog-title-stack">
              <h3 className="dialog-title">{title}</h3>
              <p className="dialog-message">{message}</p>
            </div>
            <button type="button" className="btn-modal-close" onClick={handleClose} aria-label="Close dialog">
              <IconX className="w-4 h-4" />
            </button>
          </div>

          <div className="dialog-body">
            <label className="dialog-notes-label">
              <span>Audit Log Notes {requireNotes && <strong className="text-rose">*</strong>}</span>
              <textarea
                className="dialog-notes-input"
                placeholder={notesPlaceholder}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </label>
            {error && <p className="dialog-field-error">{error}</p>}
          </div>

          <div className="dialog-footer">
            <button
              type="button"
              className="btn-dialog-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn-dialog-confirm ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <IconSpinner className="w-4 h-4 spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
