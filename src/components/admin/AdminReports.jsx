import { useState, useEffect, useCallback } from 'react';
import { 
  IconAlertTriangle, 
  IconCheckCircle, 
  IconClock, 
  IconEye, 
  IconRefreshCw, 
  IconShield
} from '../Icons';
import AdminDataTable from './AdminDataTable';
import AdminDetailModal from './AdminDetailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { getReports, moderateReport } from '../../lib/adminService';
import './AdminShell.css';

export default function AdminReports({ onShowNotice }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail Modal State
  const [selectedReport, setSelectedReport] = useState(null);

  // Moderation Dialog State
  const [modDialog, setModDialog] = useState({
    isOpen: false,
    report: null,
    targetStatus: '',
    loading: false,
  });

  const fetchReportsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports({
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    let isMounted = true;
    getReports({
      status: filterStatus === 'all' ? undefined : filterStatus,
    }).then(res => {
      if (isMounted) {
        setReports(res.reports || []);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load reports:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [filterStatus]);

  const handleStartModerate = (report, targetStatus, e) => {
    e?.stopPropagation();
    setModDialog({
      isOpen: true,
      report,
      targetStatus,
      loading: false,
    });
  };

  const handleConfirmModerate = async (notes) => {
    const { report, targetStatus } = modDialog;
    if (!report || !targetStatus) return;

    setModDialog(prev => ({ ...prev, loading: true }));
    try {
      await moderateReport({
        reportId: report.id,
        status: targetStatus,
        notes,
      });

      setReports(prev =>
        prev.map(r => r.id === report.id ? { ...r, status: targetStatus } : r)
      );

      if (selectedReport?.id === report.id) {
        setSelectedReport(prev => ({ ...prev, status: targetStatus }));
      }

      onShowNotice?.(`Report status updated to "${targetStatus}".`);
      setModDialog({ isOpen: false, report: null, targetStatus: '', loading: false });
    } catch (err) {
      console.error('Failed to update report status:', err);
      alert(`Error updating report: ${err.message}`);
      setModDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-pill pill-rose"><IconAlertTriangle className="w-3.5 h-3.5" /> Pending</span>;
      case 'investigating':
        return <span className="status-pill pill-amber"><IconClock className="w-3.5 h-3.5" /> Investigating</span>;
      case 'resolved':
        return <span className="status-pill pill-approved"><IconCheckCircle className="w-3.5 h-3.5" /> Resolved</span>;
      case 'dismissed':
        return <span className="status-pill pill-neutral">Dismissed</span>;
      default:
        return <span className="status-pill pill-neutral">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'reporter',
      header: 'Reporting Student',
      render: (row) => (
        <div className="table-user-cell">
          <div className="user-avatar-bubble avatar-rose">
            {(row.reporter?.full_name || 'R')[0].toUpperCase()}
          </div>
          <div className="user-text-stack">
            <span className="user-primary-name">{row.reporter?.full_name || 'Anonymous User'}</span>
            <span className="user-secondary-email">{row.reporter?.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'pg',
      header: 'Reported Property',
      render: (row) => (
        <div className="table-pg-cell">
          <span className="pg-main-name">{row.pg?.name || 'PG Property'}</span>
          <span className="pg-sub-area">{row.pg?.address}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Violation Reason',
      render: (row) => (
        <span className="report-reason-chip">{row.reason?.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Review Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'created_at',
      header: 'Filed Date',
      render: (row) => (
        <span className="table-date-cell">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="table-row-actions">
          <button
            type="button"
            className="btn-table-action"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReport(row);
            }}
            title="Inspect trust and safety violation details"
          >
            <IconEye className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-reports-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Trust &amp; Safety Reports</h2>
          <p className="view-subtitle">
            Community moderation queue, listing inaccuracies, safety flags, and landlord compliance investigations.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchReportsList}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={reports}
        loading={loading}
        emptyTitle="Trust &amp; Safety Queue Clear"
        emptyMessage="No safety violation reports are pending for this filter. All listings comply with community standards."
        emptyIcon={IconShield}
        filterOptions={[
          { key: 'all', label: 'All Reports', count: reports.length },
          { key: 'pending', label: 'Pending' },
          { key: 'investigating', label: 'Investigating' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'dismissed', label: 'Dismissed' },
        ]}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        onRowClick={setSelectedReport}
      />

      {/* Report Inspection Modal */}
      {selectedReport && (
        <AdminDetailModal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={`Report: ${selectedReport.reason?.replace(/_/g, ' ')}`}
          subtitle={`Filed against "${selectedReport.pg?.name || 'PG Property'}"`}
          badge={getStatusBadge(selectedReport.status)}
          footerActions={
            <div className="modal-footer-flex">
              {selectedReport.status !== 'investigating' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-warning"
                  onClick={() => handleStartModerate(selectedReport, 'investigating')}
                >
                  Mark as Investigating
                </button>
              )}
              {selectedReport.status !== 'resolved' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-emerald"
                  onClick={() => handleStartModerate(selectedReport, 'resolved')}
                >
                  Resolve Report
                </button>
              )}
              {selectedReport.status !== 'dismissed' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-neutral"
                  onClick={() => handleStartModerate(selectedReport, 'dismissed')}
                >
                  Dismiss Report
                </button>
              )}
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="dossier-grid">
            <div className="dossier-section-card">
              <h4 className="dossier-section-title">Reporter Dossier</h4>
              <div className="dossier-key-values">
                <div className="kv-row">
                  <span className="kv-key">Full Name</span>
                  <span className="kv-val">{selectedReport.reporter?.full_name || 'Anonymous User'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Email</span>
                  <span className="kv-val">{selectedReport.reporter?.email}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Phone</span>
                  <span className="kv-val">{selectedReport.reporter?.phone || 'Not listed'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Report Reason</span>
                  <span className="kv-val report-reason-highlight">{selectedReport.reason?.replace(/_/g, ' ')}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Filed Date</span>
                  <span className="kv-val">{new Date(selectedReport.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pg-desc-box" style={{ marginTop: '16px' }}>
                <h5>Violation Description</h5>
                <p className="report-full-description">
                  {selectedReport.description || 'No descriptive narrative was provided by the reporter.'}
                </p>
              </div>
            </div>

            <div className="dossier-section-card">
              <h4 className="dossier-section-title">Reported Property &amp; Owner</h4>
              <div className="dossier-key-values">
                <div className="kv-row">
                  <span className="kv-key">Property Name</span>
                  <span className="kv-val">{selectedReport.pg?.name}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Address</span>
                  <span className="kv-val">{selectedReport.pg?.address}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Property Owner</span>
                  <span className="kv-val">{selectedReport.pg?.owner?.full_name || 'Landlord'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Owner Phone</span>
                  <span className="kv-val">{selectedReport.pg?.owner?.phone || 'Not listed'}</span>
                </div>
              </div>
            </div>
          </div>
        </AdminDetailModal>
      )}

      {/* Moderation Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={modDialog.isOpen}
        onClose={() => setModDialog({ isOpen: false, report: null, targetStatus: '', loading: false })}
        onConfirm={handleConfirmModerate}
        title={`Update Report Status: ${modDialog.targetStatus.toUpperCase()}`}
        message={`Are you sure you want to mark this trust & safety report as "${modDialog.targetStatus}"?`}
        confirmLabel="Confirm Action"
        loading={modDialog.loading}
        notesPlaceholder="Provide administrative investigation notes or findings..."
        requireNotes={modDialog.targetStatus === 'resolved' || modDialog.targetStatus === 'dismissed'}
      />
    </div>
  );
}
