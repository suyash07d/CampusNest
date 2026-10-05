import { useState, useEffect, useCallback } from 'react';
import { 
  IconHome, 
  IconCheckCircle, 
  IconXCircle, 
  IconClock, 
  IconAlertTriangle, 
  IconEye, 
  IconUsers, 
  IconWifi, 
  IconGraduationCap, 
  IconRefreshCw
} from '../Icons';
import AdminDataTable from './AdminDataTable';
import AdminDetailModal from './AdminDetailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { 
  getPGListings, 
  getPGListingById, 
  moderatePGListing 
} from '../../lib/adminService';
import './AdminShell.css';

export default function AdminPGModeration({ onShowNotice, initialSelectedListing }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Inspection Modal State
  const [selectedPG, setSelectedPG] = useState(null);
  const [pgDetail, setPgDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Moderation Confirmation Dialog State
  const [moderationDialog, setModerationDialog] = useState({
    isOpen: false,
    pg: null,
    targetStatus: '',
    loading: false,
  });

  const handleOpenInspect = useCallback(async (listing) => {
    setSelectedPG(listing);
    setActiveTab('details');
    setDetailLoading(true);

    try {
      const data = await getPGListingById(listing.id);
      setPgDetail(data);
    } catch (err) {
      console.error('Failed to load PG listing details:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPGListings({
        status: filterStatus === 'all' ? undefined : filterStatus,
        query: searchQuery,
      });
      setListings(res.listings || []);
    } catch (err) {
      console.error('Failed to load PG listings for moderation:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  // Handle deep-link or initial listing passed from overview
  useEffect(() => {
    let isMounted = true;
    if (initialSelectedListing) {
      getPGListingById(initialSelectedListing.id).then(data => {
        if (isMounted) {
          setSelectedPG(initialSelectedListing);
          setPgDetail(data);
          setActiveTab('details');
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialSelectedListing]);

  const handleStartModeration = (pg, targetStatus, e) => {
    e?.stopPropagation();
    setModerationDialog({
      isOpen: true,
      pg,
      targetStatus,
      loading: false,
    });
  };

  const handleConfirmModeration = async (notes) => {
    const { pg, targetStatus } = moderationDialog;
    if (!pg || !targetStatus) return;

    setModerationDialog(prev => ({ ...prev, loading: true }));
    try {
      await moderatePGListing({
        pgId: pg.id,
        newStatus: targetStatus,
        notes,
      });

      // Update local state
      setListings(prev =>
        prev.map(l => l.id === pg.id ? { ...l, status: targetStatus } : l)
      );

      if (pgDetail?.id === pg.id) {
        setPgDetail(prev => ({ ...prev, status: targetStatus }));
      }

      const statusMap = {
        approved: 'Approved for public discovery',
        rejected: 'Rejected and hidden from discovery',
        suspended: 'Suspended pending owner compliance',
      };

      onShowNotice?.(`PG "${pg.name}" status updated: ${statusMap[targetStatus] || targetStatus}.`);
      setModerationDialog({ isOpen: false, pg: null, targetStatus: '', loading: false });
    } catch (err) {
      console.error('Failed to moderate PG listing:', err);
      alert(`Error updating PG status: ${err.message}`);
      setModerationDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-pill pill-approved"><IconCheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case 'pending':
        return <span className="status-pill pill-pending"><IconClock className="w-3.5 h-3.5" /> Pending Review</span>;
      case 'rejected':
        return <span className="status-pill pill-rejected"><IconXCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'suspended':
        return <span className="status-pill pill-suspended"><IconAlertTriangle className="w-3.5 h-3.5" /> Suspended</span>;
      default:
        return <span className="status-pill pill-neutral">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'PG Property',
      render: (row) => (
        <div className="table-pg-cell">
          <span className="pg-main-name">{row.name}</span>
          <span className="pg-sub-area">{row.area?.name || 'Pune Area'} • {row.gender_type?.toUpperCase()}</span>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Listing Owner',
      render: (row) => (
        <div className="owner-cell-stack">
          <span className="owner-name">{row.owner?.full_name || 'Landlord'}</span>
          <span className="owner-email">{row.owner?.email}</span>
        </div>
      ),
    },
    {
      key: 'starting_monthly_rent',
      header: 'Rent',
      render: (row) => (
        <span className="rent-bold-text">₹{row.starting_monthly_rent?.toLocaleString()}/mo</span>
      ),
    },
    {
      key: 'status',
      header: 'Moderation Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'created_at',
      header: 'Submitted',
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
              handleOpenInspect(row);
            }}
            title="Inspect full listing details, rooms, and photos"
          >
            <IconEye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>

          {row.status === 'pending' && (
            <>
              <button
                type="button"
                className="btn-table-action btn-action-emerald"
                onClick={(e) => handleStartModeration(row, 'approved', e)}
                title="Approve PG for discovery"
              >
                Approve
              </button>
              <button
                type="button"
                className="btn-table-action btn-action-rose"
                onClick={(e) => handleStartModeration(row, 'rejected', e)}
                title="Reject PG"
              >
                Reject
              </button>
            </>
          )}

          {row.status === 'approved' && (
            <button
              type="button"
              className="btn-table-action btn-action-amber"
              onClick={(e) => handleStartModeration(row, 'suspended', e)}
              title="Suspend listing"
            >
              Suspend
            </button>
          )}

          {row.status === 'suspended' && (
            <button
              type="button"
              className="btn-table-action btn-action-emerald"
              onClick={(e) => handleStartModeration(row, 'approved', e)}
              title="Re-approve listing"
            >
              Re-approve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-pg-moderation-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">PG Listings Moderation</h2>
          <p className="view-subtitle">
            Review submitted student hostels, verify room inventories, inspect college proximities, and enforce safety standards.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchListings}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={listings}
        loading={loading}
        emptyTitle="No PG Listings Found"
        emptyMessage={
          searchQuery
            ? `No PG properties matching "${searchQuery}". Clear query to view listings.`
            : 'No PG listings exist in the database for the selected status filter.'
        }
        emptyIcon={IconHome}
        searchPlaceholder="Search PGs by property name or street address..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { key: 'all', label: 'All Listings' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'suspended', label: 'Suspended' },
        ]}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        onRowClick={handleOpenInspect}
      />

      {/* Deep-Dive Inspection Modal */}
      {selectedPG && (
        <AdminDetailModal
          isOpen={Boolean(selectedPG)}
          onClose={() => {
            setSelectedPG(null);
            setPgDetail(null);
          }}
          title={selectedPG.name}
          subtitle={`${selectedPG.area?.name || 'Pune Area'} • Rent from ₹${selectedPG.starting_monthly_rent?.toLocaleString()}/mo`}
          badge={getStatusBadge(pgDetail?.status || selectedPG.status)}
          tabs={[
            { id: 'details', label: 'Property & Amenities', icon: IconHome },
            { id: 'rooms', label: 'Rooms & Beds', icon: IconUsers, count: pgDetail?.rooms?.length },
            { id: 'colleges', label: 'Colleges & Gates', icon: IconGraduationCap, count: pgDetail?.pg_colleges?.length },
            { id: 'enquiries', label: 'Tenant Inquiries', icon: IconClock, count: pgDetail?.enquiries?.length },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          footerActions={
            <div className="modal-footer-flex">
              {(pgDetail?.status || selectedPG.status) !== 'approved' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-primary"
                  onClick={() => handleStartModeration(pgDetail || selectedPG, 'approved')}
                >
                  Approve Listing
                </button>
              )}
              {(pgDetail?.status || selectedPG.status) === 'approved' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-warning"
                  onClick={() => handleStartModeration(pgDetail || selectedPG, 'suspended')}
                >
                  Suspend Listing
                </button>
              )}
              {(pgDetail?.status || selectedPG.status) !== 'rejected' && (
                <button
                  type="button"
                  className="btn-dialog-confirm btn-danger"
                  onClick={() => handleStartModeration(pgDetail || selectedPG, 'rejected')}
                >
                  Reject Listing
                </button>
              )}
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setSelectedPG(null)}
              >
                Close
              </button>
            </div>
          }
        >
          {detailLoading ? (
            <div className="modal-loading-box">
              <IconRefreshCw className="w-6 h-6 spinner text-indigo" />
              <p>Fetching full PG property dossier, rooms &amp; amenities...</p>
            </div>
          ) : (
            <div className="dossier-tab-content">
              {/* Tab 1: Details & Amenities */}
              {activeTab === 'details' && pgDetail && (
                <div className="dossier-grid">
                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Property Details</h4>
                    <div className="dossier-key-values">
                      <div className="kv-row">
                        <span className="kv-key">Full Address</span>
                        <span className="kv-val">{pgDetail.address}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Gender Accommodation</span>
                        <span className="kv-val">{pgDetail.gender_type?.toUpperCase()}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Starting Rent</span>
                        <span className="kv-val">₹{pgDetail.starting_monthly_rent?.toLocaleString()} / month</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Security Deposit</span>
                        <span className="kv-val">₹{pgDetail.security_deposit?.toLocaleString() || 0}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Notice Period</span>
                        <span className="kv-val">{pgDetail.notice_period_days ?? 30} days</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Food Service</span>
                        <span className="kv-val">
                          {pgDetail.food_available ? `Included (${pgDetail.food_type || 'both'})` : 'Self-cooking / None'}
                        </span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Curfew Timing</span>
                        <span className="kv-val">{pgDetail.curfew_time || 'No restrictive curfew'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Owner Contact</span>
                        <span className="kv-val">
                          {pgDetail.owner?.full_name} ({pgDetail.owner?.email} • {pgDetail.owner?.phone || 'No phone'})
                        </span>
                      </div>
                    </div>

                    <div className="pg-desc-box">
                      <h5>Description</h5>
                      <p>{pgDetail.description}</p>
                    </div>
                  </div>

                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Amenities &amp; Utilities</h4>
                    {pgDetail.pg_amenities?.length > 0 ? (
                      <div className="amenities-tags-grid">
                        {pgDetail.pg_amenities.map(a => (
                          <span key={a.id || a.amenity?.id} className="amenity-chip-pill">
                            <IconWifi className="w-3.5 h-3.5 text-indigo" />
                            {a.amenity?.name || 'Amenity'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-subtext">No explicit amenities tagged to this listing.</p>
                    )}

                    <h4 className="dossier-section-title" style={{ marginTop: '24px' }}>Property Photos</h4>
                    {pgDetail.pg_photos?.length > 0 ? (
                      <div className="pg-photos-preview-row">
                        {pgDetail.pg_photos.map(p => (
                          <div key={p.id} className="photo-thumb-card">
                            <img src={p.storage_path} alt={p.caption || 'PG'} />
                            {p.caption && <span className="photo-caption">{p.caption}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-subtext">No photos uploaded by owner yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Rooms & Inventory */}
              {activeTab === 'rooms' && (
                <div className="rooms-table-container">
                  {(!pgDetail?.rooms || pgDetail.rooms.length === 0) ? (
                    <div className="queue-empty-state">
                      <IconUsers className="w-8 h-8 text-dim" />
                      <h4>No Room Configurations Defined</h4>
                      <p>Owner has not yet specified room sharing types or bed capacities.</p>
                    </div>
                  ) : (
                    <table className="admin-subtable">
                      <thead>
                        <tr>
                          <th>Sharing Type</th>
                          <th>Monthly Rent</th>
                          <th>Available Beds</th>
                          <th>Total Beds</th>
                          <th>Washroom</th>
                          <th>Air Conditioning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pgDetail.rooms.map(room => (
                          <tr key={room.id}>
                            <td><strong>{room.room_type?.replace(/_/g, ' ').toUpperCase()}</strong></td>
                            <td>₹{room.monthly_rent?.toLocaleString()}/mo</td>
                            <td>
                              <span className={`beds-badge ${room.available_beds > 0 ? 'badge-green' : 'badge-red'}`}>
                                {room.available_beds} beds free
                              </span>
                            </td>
                            <td>{room.total_beds} beds</td>
                            <td>{room.has_attached_washroom ? '✓ Attached' : 'Shared'}</td>
                            <td>{room.has_ac ? '✓ AC' : 'Non-AC'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 3: Colleges & Gates Proximity */}
              {activeTab === 'colleges' && (
                <div className="colleges-proximity-container">
                  {(!pgDetail?.pg_colleges || pgDetail.pg_colleges.length === 0) ? (
                    <div className="queue-empty-state">
                      <IconGraduationCap className="w-8 h-8 text-dim" />
                      <h4>No Proximity Mappings Defined</h4>
                      <p>No college proximity relations mapped to this PG property.</p>
                    </div>
                  ) : (
                    <div className="proximity-cards-list">
                      {pgDetail.pg_colleges.map(c => (
                        <div key={c.id} className="proximity-item-card">
                          <div className="prox-left">
                            <span className="prox-college-name">{c.college?.name}</span>
                            <span className="prox-college-addr">{c.college?.address}</span>
                          </div>
                          <div className="prox-right">
                            <span className="prox-distance">{c.distance_meters} meters</span>
                            <span className="prox-time">{c.walking_time_mins} mins walk</span>
                            {c.is_primary && <span className="primary-gate-tag">Primary Campus</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Tenant Enquiries */}
              {activeTab === 'enquiries' && (
                <div className="pg-enquiries-container">
                  {(!pgDetail?.enquiries || pgDetail.enquiries.length === 0) ? (
                    <div className="queue-empty-state">
                      <IconClock className="w-8 h-8 text-dim" />
                      <h4>No Tenant Inquiries Yet</h4>
                      <p>No students have sent inquiries for this specific PG.</p>
                    </div>
                  ) : (
                    <div className="enquiry-cards-list">
                      {pgDetail.enquiries.map(e => (
                        <div key={e.id} className="enquiry-card-row">
                          <div className="enquiry-student-info">
                            <span className="enquiry-student-name">{e.student?.full_name}</span>
                            <span className="enquiry-student-contact">{e.student?.email} • {e.student?.phone || 'No phone'}</span>
                          </div>
                          <div className="enquiry-pg-info">
                            <span className="enquiry-room-pref">Preference: {e.room_type_preference || 'Standard'}</span>
                            <p className="enquiry-message-quote">"{e.message || 'Interested in visiting.'}"</p>
                          </div>
                          <div className="enquiry-status-col">
                            <span className={`status-pill pill-${e.status}`}>{e.status}</span>
                            <span className="enquiry-date">{new Date(e.created_at).toLocaleDateString('en-IN')}</span>
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

      {/* Moderation Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={moderationDialog.isOpen}
        onClose={() => setModerationDialog({ isOpen: false, pg: null, targetStatus: '', loading: false })}
        onConfirm={handleConfirmModeration}
        title={
          moderationDialog.targetStatus === 'approved' ? 'Approve PG Listing' :
          moderationDialog.targetStatus === 'rejected' ? 'Reject PG Listing' :
          moderationDialog.targetStatus === 'suspended' ? 'Suspend PG Listing' : 'Confirm Action'
        }
        message={
          moderationDialog.targetStatus === 'approved'
            ? `Are you sure you want to approve "${moderationDialog.pg?.name}"? It will become visible on the public student discovery portal.`
            : moderationDialog.targetStatus === 'rejected'
            ? `Are you sure you want to reject "${moderationDialog.pg?.name}"? The owner will see this status.`
            : `Are you sure you want to suspend "${moderationDialog.pg?.name}"? It will immediately disappear from discovery search.`
        }
        confirmLabel={
          moderationDialog.targetStatus === 'approved' ? 'Approve Listing' :
          moderationDialog.targetStatus === 'rejected' ? 'Reject Listing' :
          moderationDialog.targetStatus === 'suspended' ? 'Suspend Listing' : 'Confirm'
        }
        isDestructive={moderationDialog.targetStatus === 'rejected' || moderationDialog.targetStatus === 'suspended'}
        loading={moderationDialog.loading}
        notesPlaceholder="Administrative reason for this moderation action (will be logged into immutable audit trail)..."
        requireNotes={moderationDialog.targetStatus === 'rejected'}
      />
    </div>
  );
}
