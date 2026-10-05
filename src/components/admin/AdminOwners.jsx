import { useState, useEffect, useCallback } from 'react';
import { 
  IconBuilding, 
  IconCheckCircle, 
  IconEye, 
  IconHome, 
  IconMail, 
  IconRefreshCw
} from '../Icons';
import AdminDataTable from './AdminDataTable';
import AdminDetailModal from './AdminDetailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { 
  getOwners, 
  getOwnerById, 
  updateStudentVerification 
} from '../../lib/adminService';
import './AdminShell.css';

export default function AdminOwners({ onShowNotice }) {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Detail Modal State
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerDossier, setOwnerDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Verification Dialog State
  const [verifyDialogState, setVerifyDialogState] = useState({
    isOpen: false,
    owner: null,
    targetVerified: false,
    loading: false,
  });

  const fetchOwnersList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOwners({ query: searchQuery });
      setOwners(res.owners || []);
    } catch (err) {
      console.error('Failed to load owners:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOwnersList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOwnersList]);

  const handleOpenOwnerModal = async (owner) => {
    setSelectedOwner(owner);
    setActiveTab('profile');
    setDossierLoading(true);

    try {
      const data = await getOwnerById(owner.id);
      setOwnerDossier(data);
    } catch (err) {
      console.error('Failed to load owner details:', err);
    } finally {
      setDossierLoading(false);
    }
  };

  const handleToggleVerification = (owner, e) => {
    e?.stopPropagation();
    setVerifyDialogState({
      isOpen: true,
      owner,
      targetVerified: !owner.is_verified,
      loading: false,
    });
  };

  const handleConfirmVerification = async (notes) => {
    const { owner, targetVerified } = verifyDialogState;
    if (!owner) return;

    setVerifyDialogState(prev => ({ ...prev, loading: true }));
    try {
      await updateStudentVerification({
        studentId: owner.id,
        isVerified: targetVerified,
        notes,
      });

      setOwners(prev =>
        prev.map(o => o.id === owner.id ? { ...o, is_verified: targetVerified } : o)
      );

      if (ownerDossier?.profile?.id === owner.id) {
        setOwnerDossier(prev => ({
          ...prev,
          profile: { ...prev.profile, is_verified: targetVerified },
        }));
      }

      onShowNotice?.(`Owner ${owner.full_name} verification status set to ${targetVerified ? 'Verified' : 'Unverified'}.`);
      setVerifyDialogState({ isOpen: false, owner: null, targetVerified: false, loading: false });
    } catch (err) {
      console.error('Failed to update owner verification:', err);
      alert(`Error updating verification: ${err.message}`);
      setVerifyDialogState(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredOwners = owners.filter(o => {
    if (filterStatus === 'verified') return o.is_verified;
    if (filterStatus === 'unverified') return !o.is_verified;
    return true;
  });

  const columns = [
    {
      key: 'full_name',
      header: 'Property Owner',
      render: (row) => (
        <div className="table-user-cell">
          <div className="user-avatar-bubble avatar-owner">
            {(row.full_name || 'O')[0].toUpperCase()}
          </div>
          <div className="user-text-stack">
            <span className="user-primary-name">{row.full_name}</span>
            <span className="user-secondary-email">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (row) => (
        <span className="table-text-muted">{row.phone || 'Not specified'}</span>
      ),
    },
    {
      key: 'is_verified',
      header: 'Trust Status',
      render: (row) => (
        row.is_verified ? (
          <span className="pill-badge-status badge-verified">
            <IconCheckCircle className="w-3.5 h-3.5" />
            Verified Owner
          </span>
        ) : (
          <span className="pill-badge-status badge-unverified">
            Unverified
          </span>
        )
      ),
    },
    {
      key: 'listings',
      header: 'Properties Portfolio',
      render: (row) => (
        <div className="owner-listing-stats-row">
          <span className="portfolio-total-chip" title="Total listings">
            <IconHome className="w-3.5 h-3.5" />
            <strong>{row.totalListings ?? 0}</strong> PGs
          </span>
          {row.pendingListings > 0 && (
            <span className="portfolio-pending-chip" title="Pending moderation">
              {row.pendingListings} pending
            </span>
          )}
          {row.approvedListings > 0 && (
            <span className="portfolio-approved-chip" title="Approved listings">
              {row.approvedListings} live
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered Date',
      render: (row) => (
        <span className="table-date-cell">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
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
              handleOpenOwnerModal(row);
            }}
            title="Inspect owner portfolio and listings"
          >
            <IconEye className="w-3.5 h-3.5" />
            <span>Portfolio</span>
          </button>
          <button
            type="button"
            className={`btn-table-action ${row.is_verified ? 'btn-action-neutral' : 'btn-action-emerald'}`}
            onClick={(e) => handleToggleVerification(row, e)}
            title={row.is_verified ? 'Revoke verification' : 'Verify owner'}
          >
            {row.is_verified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-owners-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Property Owners &amp; Landlords</h2>
          <p className="view-subtitle">
            Verified property partners, portfolio listings, compliance checks, and tenant enquiry distribution.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchOwnersList}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredOwners}
        loading={loading}
        emptyTitle="No Property Owners Found"
        emptyMessage={
          searchQuery
            ? `No owners matching "${searchQuery}". Clear query to view all property owners.`
            : 'No property owners have registered on CampusNest yet. Zero demo profiles are created.'
        }
        emptyIcon={IconBuilding}
        searchPlaceholder="Search owners by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { key: 'all', label: 'All Owners', count: owners.length },
          { key: 'verified', label: 'Verified', count: owners.filter(o => o.is_verified).length },
          { key: 'unverified', label: 'Unverified', count: owners.filter(o => !o.is_verified).length },
        ]}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        onRowClick={handleOpenOwnerModal}
      />

      {/* Owner Detail Modal */}
      {selectedOwner && (
        <AdminDetailModal
          isOpen={Boolean(selectedOwner)}
          onClose={() => {
            setSelectedOwner(null);
            setOwnerDossier(null);
          }}
          title={selectedOwner.full_name || 'Owner Profile'}
          subtitle={selectedOwner.email}
          badge={selectedOwner.is_verified ? 'Verified Partner' : 'Unverified Partner'}
          tabs={[
            { id: 'profile', label: 'Owner Profile', icon: IconBuilding },
            { id: 'listings', label: 'Owned PGs', icon: IconHome, count: ownerDossier?.listings?.length },
            { id: 'enquiries', label: 'Received Enquiries', icon: IconMail, count: ownerDossier?.enquiries?.length },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          footerActions={
            <div className="modal-footer-flex">
              <button
                type="button"
                className={`btn-dialog-confirm ${selectedOwner.is_verified ? 'btn-danger' : 'btn-primary'}`}
                onClick={(e) => handleToggleVerification(selectedOwner, e)}
              >
                {selectedOwner.is_verified ? 'Revoke Verification' : 'Verify Owner Profile'}
              </button>
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setSelectedOwner(null)}
              >
                Close
              </button>
            </div>
          }
        >
          {dossierLoading ? (
            <div className="modal-loading-box">
              <IconRefreshCw className="w-6 h-6 spinner text-indigo" />
              <p>Fetching owner portfolio and listings...</p>
            </div>
          ) : (
            <div className="dossier-tab-content">
              {/* Tab 1: Profile Details */}
              {activeTab === 'profile' && (
                <div className="dossier-grid">
                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Owner Information</h4>
                    <div className="dossier-key-values">
                      <div className="kv-row">
                        <span className="kv-key">Full Name</span>
                        <span className="kv-val">{selectedOwner.full_name}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Email</span>
                        <span className="kv-val">{selectedOwner.email}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Phone</span>
                        <span className="kv-val">{selectedOwner.phone || 'Not provided'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Verification Status</span>
                        <span className="kv-val">
                          {selectedOwner.is_verified ? (
                            <span className="pill-badge-status badge-verified">Verified</span>
                          ) : (
                            <span className="pill-badge-status badge-unverified">Unverified</span>
                          )}
                        </span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Joined Date</span>
                        <span className="kv-val">
                          {selectedOwner.created_at ? new Date(selectedOwner.created_at).toLocaleString('en-IN') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Portfolio Metrics</h4>
                    <div className="engagement-summary-chips">
                      <div className="summary-chip-box">
                        <span className="chip-num">{ownerDossier?.listings?.length || 0}</span>
                        <span className="chip-label">Total Listings</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">
                          {ownerDossier?.listings?.filter(l => l.status === 'approved').length || 0}
                        </span>
                        <span className="chip-label">Live Approved</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">
                          {ownerDossier?.listings?.filter(l => l.status === 'pending').length || 0}
                        </span>
                        <span className="chip-label">Pending Review</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">{ownerDossier?.enquiries?.length || 0}</span>
                        <span className="chip-label">Tenant Leads</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Owned PGs */}
              {activeTab === 'listings' && (
                <div className="owner-listings-tab">
                  {(!ownerDossier?.listings || ownerDossier.listings.length === 0) ? (
                    <div className="queue-empty-state">
                      <IconHome className="w-8 h-8 text-dim" />
                      <h4>No PG Listings Added</h4>
                      <p>This owner has not created any PG listings yet.</p>
                    </div>
                  ) : (
                    <div className="owner-listings-cards-grid">
                      {ownerDossier.listings.map((pg) => (
                        <div key={pg.id} className="owner-pg-card">
                          <div className="owner-pg-header">
                            <div>
                              <h5 className="owner-pg-name">{pg.name}</h5>
                              <span className="owner-pg-area">{pg.area?.name || 'Pune Area'}</span>
                            </div>
                            <span className={`status-pill pill-${pg.status}`}>
                              {pg.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="owner-pg-address">{pg.address}</p>
                          <div className="owner-pg-footer">
                            <span className="pg-rent-tag">₹{pg.starting_monthly_rent?.toLocaleString()}/mo</span>
                            <span className="pg-rooms-count">{pg.rooms?.length || 0} room types</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Enquiries */}
              {activeTab === 'enquiries' && (
                <div className="owner-enquiries-tab">
                  {(!ownerDossier?.enquiries || ownerDossier.enquiries.length === 0) ? (
                    <div className="queue-empty-state">
                      <IconMail className="w-8 h-8 text-dim" />
                      <h4>No Enquiries Received</h4>
                      <p>No tenant leads have been submitted for this owner's properties yet.</p>
                    </div>
                  ) : (
                    <div className="enquiry-cards-list">
                      {ownerDossier.enquiries.map((enq) => (
                        <div key={enq.id} className="enquiry-card-row">
                          <div className="enquiry-student-info">
                            <span className="enquiry-student-name">{enq.student?.full_name}</span>
                            <span className="enquiry-student-contact">{enq.student?.email} • {enq.student?.phone || 'No phone'}</span>
                          </div>
                          <div className="enquiry-pg-info">
                            <span className="enquiry-pg-name">{enq.pg?.name}</span>
                            <span className="enquiry-room-pref">Pref: {enq.room_type_preference || 'Any room'}</span>
                          </div>
                          <div className="enquiry-status-col">
                            <span className={`status-pill pill-${enq.status}`}>{enq.status}</span>
                            <span className="enquiry-date">{new Date(enq.created_at).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </AdminDetailModal>
      )}

      {/* Verify/Unverify Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={verifyDialogState.isOpen}
        onClose={() => setVerifyDialogState({ isOpen: false, owner: null, targetVerified: false, loading: false })}
        onConfirm={handleConfirmVerification}
        title={verifyDialogState.targetVerified ? 'Verify Owner Profile' : 'Revoke Owner Verification'}
        message={
          verifyDialogState.targetVerified
            ? `Are you sure you want to verify ${verifyDialogState.owner?.full_name}? Verified owners receive trusted landlord badges.`
            : `Are you sure you want to revoke verification for ${verifyDialogState.owner?.full_name}?`
        }
        confirmLabel={verifyDialogState.targetVerified ? 'Verify Owner' : 'Revoke Verification'}
        isDestructive={!verifyDialogState.targetVerified}
        loading={verifyDialogState.loading}
        notesPlaceholder="Provide reason or audit notes for this owner verification change..."
      />
    </div>
  );
}
