import { useState, useEffect, useCallback } from 'react';
import { 
  IconMail, 
  IconRefreshCw, 
  IconEye
} from '../Icons';
import AdminDataTable from './AdminDataTable';
import AdminDetailModal from './AdminDetailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { getEnquiries, updateEnquiryStatus } from '../../lib/adminService';
import './AdminShell.css';

export default function AdminEnquiries({ onShowNotice }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Inspection Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Status Change Dialog State
  const [statusDialog, setStatusDialog] = useState({
    isOpen: false,
    enquiry: null,
    targetStatus: '',
    loading: false,
  });

  const fetchEnquiriesList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEnquiries({
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setEnquiries(res.enquiries || []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    let isMounted = true;
    getEnquiries({
      status: filterStatus === 'all' ? undefined : filterStatus,
    }).then(res => {
      if (isMounted) {
        setEnquiries(res.enquiries || []);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load enquiries:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [filterStatus]);

  const handleStartStatusUpdate = (enquiry, targetStatus, e) => {
    e?.stopPropagation();
    setStatusDialog({
      isOpen: true,
      enquiry,
      targetStatus,
      loading: false,
    });
  };

  const handleConfirmStatusUpdate = async (notes) => {
    const { enquiry, targetStatus } = statusDialog;
    if (!enquiry || !targetStatus) return;

    setStatusDialog(prev => ({ ...prev, loading: true }));
    try {
      await updateEnquiryStatus({
        enquiryId: enquiry.id,
        status: targetStatus,
        notes,
      });

      setEnquiries(prev =>
        prev.map(e => e.id === enquiry.id ? { ...e, status: targetStatus } : e)
      );

      if (selectedEnquiry?.id === enquiry.id) {
        setSelectedEnquiry(prev => ({ ...prev, status: targetStatus }));
      }

      onShowNotice?.(`Enquiry status updated to "${targetStatus.replace(/_/g, ' ')}".`);
      setStatusDialog({ isOpen: false, enquiry: null, targetStatus: '', loading: false });
    } catch (err) {
      console.error('Failed to update enquiry status:', err);
      alert(`Error updating enquiry: ${err.message}`);
      setStatusDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-pill pill-pending">Pending</span>;
      case 'contacted':
        return <span className="status-pill pill-indigo">Contacted</span>;
      case 'visit_scheduled':
        return <span className="status-pill pill-approved">Visit Scheduled</span>;
      case 'closed':
        return <span className="status-pill pill-neutral">Closed</span>;
      default:
        return <span className="status-pill pill-neutral">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'student',
      header: 'Student Applicant',
      render: (row) => (
        <div className="table-user-cell">
          <div className="user-avatar-bubble">
            {(row.student?.full_name || 'S')[0].toUpperCase()}
          </div>
          <div className="user-text-stack">
            <span className="user-primary-name">{row.student?.full_name || 'Student'}</span>
            <span className="user-secondary-email">{row.student?.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'pg',
      header: 'Target PG Listing',
      render: (row) => (
        <div className="table-pg-cell">
          <span className="pg-main-name">{row.pg?.name || 'PG Property'}</span>
          <span className="pg-sub-area">{row.pg?.address}</span>
        </div>
      ),
    },
    {
      key: 'room_type_preference',
      header: 'Room / Visit',
      render: (row) => (
        <div className="preference-cell-stack">
          <span className="pref-room">{row.room_type_preference ? row.room_type_preference.replace(/_/g, ' ') : 'Any Sharing'}</span>
          {row.visit_date && (
            <span className="pref-visit-date">Visit: {new Date(row.visit_date).toLocaleDateString('en-IN')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Enquiry Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'created_at',
      header: 'Received Date',
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
              setSelectedEnquiry(row);
            }}
            title="Inspect enquiry message and landlord connection"
          >
            <IconEye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-enquiries-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Student Housing Enquiries</h2>
          <p className="view-subtitle">
            Track student accommodation enquiries, booking visits, and landlord response times.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchEnquiriesList}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={enquiries}
        loading={loading}
        emptyTitle="No Housing Enquiries Found"
        emptyMessage="No student enquiries match the selected filter. As students submit enquiry forms, they will show here."
        emptyIcon={IconMail}
        filterOptions={[
          { key: 'all', label: 'All Enquiries', count: enquiries.length },
          { key: 'pending', label: 'Pending' },
          { key: 'contacted', label: 'Contacted' },
          { key: 'visit_scheduled', label: 'Visit Scheduled' },
          { key: 'closed', label: 'Closed' },
        ]}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        onRowClick={setSelectedEnquiry}
      />

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <AdminDetailModal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title={`Enquiry for ${selectedEnquiry.pg?.name || 'PG'}`}
          subtitle={`From ${selectedEnquiry.student?.full_name} (${selectedEnquiry.student?.email})`}
          badge={getStatusBadge(selectedEnquiry.status)}
          footerActions={
            <div className="modal-footer-flex">
              {selectedEnquiry.status !== 'contacted' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-primary"
                  onClick={() => handleStartStatusUpdate(selectedEnquiry, 'contacted')}
                >
                  Mark as Contacted
                </button>
              )}
              {selectedEnquiry.status !== 'visit_scheduled' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-emerald"
                  onClick={() => handleStartStatusUpdate(selectedEnquiry, 'visit_scheduled')}
                >
                  Schedule Visit
                </button>
              )}
              {selectedEnquiry.status !== 'closed' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-neutral"
                  onClick={() => handleStartStatusUpdate(selectedEnquiry, 'closed')}
                >
                  Close Enquiry
                </button>
              )}
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setSelectedEnquiry(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="dossier-grid">
            <div className="dossier-section-card">
              <h4 className="dossier-section-title">Student Applicant</h4>
              <div className="dossier-key-values">
                <div className="kv-row">
                  <span className="kv-key">Full Name</span>
                  <span className="kv-val">{selectedEnquiry.student?.full_name}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Email</span>
                  <span className="kv-val">{selectedEnquiry.student?.email}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Phone</span>
                  <span className="kv-val">{selectedEnquiry.student?.phone || 'Not specified'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Room Preference</span>
                  <span className="kv-val">{selectedEnquiry.room_type_preference || 'Standard / Any'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Preferred Visit Date</span>
                  <span className="kv-val">{selectedEnquiry.visit_date ? new Date(selectedEnquiry.visit_date).toLocaleDateString('en-IN') : 'Flexible'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Filed At</span>
                  <span className="kv-val">{new Date(selectedEnquiry.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="dossier-section-card">
              <h4 className="dossier-section-title">Target Property &amp; Owner</h4>
              <div className="dossier-key-values">
                <div className="kv-row">
                  <span className="kv-key">Property Name</span>
                  <span className="kv-val">{selectedEnquiry.pg?.name}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Address</span>
                  <span className="kv-val">{selectedEnquiry.pg?.address}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Starting Rent</span>
                  <span className="kv-val">₹{selectedEnquiry.pg?.starting_monthly_rent?.toLocaleString()}/mo</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Owner Name</span>
                  <span className="kv-val">{selectedEnquiry.pg?.owner?.full_name || 'Owner'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">Owner Phone</span>
                  <span className="kv-val">{selectedEnquiry.pg?.owner?.phone || 'Not listed'}</span>
                </div>
              </div>

              <div className="pg-desc-box" style={{ marginTop: '16px' }}>
                <h5>Applicant Message</h5>
                <p className="enquiry-full-message">
                  {selectedEnquiry.message || 'No additional message was written by the student.'}
                </p>
              </div>
            </div>
          </div>
        </AdminDetailModal>
      )}

      {/* Status Update Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, enquiry: null, targetStatus: '', loading: false })}
        onConfirm={handleConfirmStatusUpdate}
        title="Update Enquiry Status"
        message={`Are you sure you want to mark this enquiry as "${statusDialog.targetStatus.replace(/_/g, ' ')}"?`}
        confirmLabel="Update Status"
        loading={statusDialog.loading}
        notesPlaceholder="Audit notes regarding this enquiry status change..."
      />
    </div>
  );
}
