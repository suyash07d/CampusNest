import { useState, useEffect, useCallback } from 'react';
import { 
  IconGraduationCap, 
  IconCheckCircle, 
  IconEye, 
  IconMail, 
  IconHeart, 
  IconActivity,
  IconMapPin,
  IconRefreshCw
} from '../Icons';
import AdminDataTable from './AdminDataTable';
import AdminDetailModal from './AdminDetailModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import { 
  getStudents, 
  getStudentById, 
  getStudentActivity, 
  getStudentDemandSummary, 
  updateStudentVerification 
} from '../../lib/adminService';
import './AdminShell.css';

export default function AdminStudents({ onShowNotice }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, verified, unverified

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Verification Dialog State
  const [verifyDialogState, setVerifyDialogState] = useState({
    isOpen: false,
    student: null,
    targetVerified: false,
    loading: false,
  });

  const fetchStudentsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ query: searchQuery });
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudentsList();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudentsList]);

  // Open Dossier Modal
  const handleOpenDossier = async (student) => {
    setSelectedStudent(student);
    setActiveTab('profile');
    setDossierLoading(true);

    try {
      const [fullDossier, studentActivities, demandSummary] = await Promise.all([
        getStudentById(student.id),
        getStudentActivity(student.id, { limit: 40 }),
        getStudentDemandSummary(student.id),
      ]);

      setDossierData({
        dossier: fullDossier,
        activities: studentActivities,
        demand: demandSummary,
      });
    } catch (err) {
      console.error('Failed to load student dossier:', err);
    } finally {
      setDossierLoading(false);
    }
  };

  // Open Verify/Unverify Confirmation
  const handleToggleVerification = (student, e) => {
    e?.stopPropagation();
    setVerifyDialogState({
      isOpen: true,
      student,
      targetVerified: !student.is_verified,
      loading: false,
    });
  };

  const handleConfirmVerification = async (notes) => {
    const { student, targetVerified } = verifyDialogState;
    if (!student) return;

    setVerifyDialogState(prev => ({ ...prev, loading: true }));
    try {
      await updateStudentVerification({
        studentId: student.id,
        isVerified: targetVerified,
        notes,
      });

      // Update local student row
      setStudents(prev =>
        prev.map(s => s.id === student.id ? { ...s, is_verified: targetVerified } : s)
      );

      if (dossierData?.dossier?.profile?.id === student.id) {
        setDossierData(prev => ({
          ...prev,
          dossier: {
            ...prev.dossier,
            profile: { ...prev.dossier.profile, is_verified: targetVerified },
          },
        }));
      }

      onShowNotice?.(`Student ${student.full_name} verification status set to ${targetVerified ? 'Verified' : 'Unverified'}.`);
      setVerifyDialogState({ isOpen: false, student: null, targetVerified: false, loading: false });
    } catch (err) {
      console.error('Failed to update verification:', err);
      alert(`Error updating verification: ${err.message}`);
      setVerifyDialogState(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredStudents = students.filter(s => {
    if (filterStatus === 'verified') return s.is_verified;
    if (filterStatus === 'unverified') return !s.is_verified;
    return true;
  });

  const columns = [
    {
      key: 'full_name',
      header: 'Student Name',
      render: (row) => (
        <div className="table-user-cell">
          <div className="user-avatar-bubble">
            {(row.full_name || 'S')[0].toUpperCase()}
          </div>
          <div className="user-text-stack">
            <span className="user-primary-name">{row.full_name}</span>
            <span className="user-secondary-email">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'college',
      header: 'College Affiliation',
      render: (row) => (
        <div className="college-cell-stack">
          <span className="college-title">{row.college?.name || row.college?.short_name || 'Independent Student'}</span>
          {row.college?.slug && <span className="college-slug-tag">Pune Campus</span>}
        </div>
      ),
    },
    {
      key: 'is_verified',
      header: 'Status',
      render: (row) => (
        row.is_verified ? (
          <span className="pill-badge-status badge-verified">
            <IconCheckCircle className="w-3.5 h-3.5" />
            Verified
          </span>
        ) : (
          <span className="pill-badge-status badge-unverified">
            Unverified
          </span>
        )
      ),
    },
    {
      key: 'engagement',
      header: 'Engagement',
      render: (row) => (
        <div className="cell-metrics-row">
          <span className="cell-stat-chip" title="Enquiries submitted">
            <IconMail className="w-3 h-3 text-indigo" />
            {row.enquiriesCount ?? 0}
          </span>
          <span className="cell-stat-chip" title="PGs favourited">
            <IconHeart className="w-3 h-3 text-rose" />
            {row.favouritesCount ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined Date',
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
              handleOpenDossier(row);
            }}
            title="Inspect student dossier and intelligence"
          >
            <IconEye className="w-3.5 h-3.5" />
            <span>Dossier</span>
          </button>
          <button
            type="button"
            className={`btn-table-action ${row.is_verified ? 'btn-action-neutral' : 'btn-action-emerald'}`}
            onClick={(e) => handleToggleVerification(row, e)}
            title={row.is_verified ? 'Revoke verification' : 'Verify student'}
          >
            {row.is_verified ? 'Unverify' : 'Verify'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-students-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Registered Students Intelligence</h2>
          <p className="view-subtitle">
            Authentic student profiles, academic affiliations, search demand footprint, and verification statuses.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchStudentsList}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={filteredStudents}
        loading={loading}
        emptyTitle="No Student Profiles Found"
        emptyMessage={
          searchQuery
            ? `No students matching "${searchQuery}". Clear query to view all students.`
            : 'No students have registered on CampusNest yet. Zero demo profiles are created.'
        }
        emptyIcon={IconGraduationCap}
        searchPlaceholder="Search students by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { key: 'all', label: 'All Students', count: students.length },
          { key: 'verified', label: 'Verified', count: students.filter(s => s.is_verified).length },
          { key: 'unverified', label: 'Unverified', count: students.filter(s => !s.is_verified).length },
        ]}
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
        onRowClick={handleOpenDossier}
      />

      {/* Student Dossier Detail Modal */}
      {selectedStudent && (
        <AdminDetailModal
          isOpen={Boolean(selectedStudent)}
          onClose={() => {
            setSelectedStudent(null);
            setDossierData(null);
          }}
          title={selectedStudent.full_name || 'Student Dossier'}
          subtitle={selectedStudent.email}
          badge={selectedStudent.is_verified ? 'Verified Student' : 'Unverified'}
          tabs={[
            { id: 'profile', label: 'Profile Dossier', icon: IconGraduationCap },
            { id: 'activity', label: 'Activity Timeline', icon: IconActivity, count: dossierData?.activities?.length },
            { id: 'demand', label: 'Demand Intelligence', icon: IconMapPin },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          footerActions={
            <div className="modal-footer-flex">
              <button
                type="button"
                className={`btn-dialog-confirm ${selectedStudent.is_verified ? 'btn-danger' : 'btn-primary'}`}
                onClick={(e) => handleToggleVerification(selectedStudent, e)}
              >
                {selectedStudent.is_verified ? 'Revoke Verification' : 'Verify Student Profile'}
              </button>
              <button
                type="button"
                className="btn-dialog-cancel"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          }
        >
          {dossierLoading ? (
            <div className="modal-loading-box">
              <IconRefreshCw className="w-6 h-6 spinner text-indigo" />
              <p>Fetching authentic student dossier &amp; telemetry...</p>
            </div>
          ) : (
            <div className="dossier-tab-content">
              {/* Tab 1: Profile Dossier */}
              {activeTab === 'profile' && (
                <div className="dossier-grid">
                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Identity &amp; Credentials</h4>
                    <div className="dossier-key-values">
                      <div className="kv-row">
                        <span className="kv-key">Full Name</span>
                        <span className="kv-val">{selectedStudent.full_name}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Email Address</span>
                        <span className="kv-val">{selectedStudent.email}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Phone Number</span>
                        <span className="kv-val">{selectedStudent.phone || 'Not provided'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">College Institution</span>
                        <span className="kv-val">{selectedStudent.college?.name || 'Independent / Not specified'}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Verification Status</span>
                        <span className="kv-val">
                          {selectedStudent.is_verified ? (
                            <span className="pill-badge-status badge-verified">Verified</span>
                          ) : (
                            <span className="pill-badge-status badge-unverified">Unverified</span>
                          )}
                        </span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-key">Registration Date</span>
                        <span className="kv-val">
                          {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleString('en-IN') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dossier-section-card">
                    <h4 className="dossier-section-title">Engagement Summary</h4>
                    <div className="engagement-summary-chips">
                      <div className="summary-chip-box">
                        <span className="chip-num">{dossierData?.dossier?.enquiries?.length || 0}</span>
                        <span className="chip-label">Enquiries Filed</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">{dossierData?.dossier?.favourites?.length || 0}</span>
                        <span className="chip-label">PGs Favourited</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">{dossierData?.dossier?.reviews?.length || 0}</span>
                        <span className="chip-label">Reviews Written</span>
                      </div>
                      <div className="summary-chip-box">
                        <span className="chip-num">{dossierData?.dossier?.reports?.length || 0}</span>
                        <span className="chip-label">Reports Submitted</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Activity Timeline */}
              {activeTab === 'activity' && (
                <div className="timeline-container">
                  {dossierData?.activities?.length === 0 ? (
                    <div className="queue-empty-state">
                      <IconActivity className="w-8 h-8 text-dim" />
                      <h4>No Activity Events Recorded</h4>
                      <p>This student has not triggered any logged events yet.</p>
                    </div>
                  ) : (
                    <div className="timeline-items-list">
                      {dossierData.activities.map((act) => (
                        <div key={act.id} className="timeline-row">
                          <div className="timeline-dot" />
                          <div className="timeline-content-card">
                            <div className="timeline-header-line">
                              <span className="timeline-action-name">{act.action.replace(/_/g, ' ')}</span>
                              <span className="timeline-timestamp">
                                {new Date(act.created_at).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {act.metadata && Object.keys(act.metadata).length > 0 && (
                              <pre className="timeline-meta-preview">
                                {JSON.stringify(act.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Demand Intelligence */}
              {activeTab === 'demand' && (
                <div className="student-demand-view">
                  <div className="demand-stats-row">
                    <div className="stat-pill-item">
                      <span className="stat-num">{dossierData?.demand?.totalSearches || 0}</span>
                      <span className="stat-label">Total PG Searches</span>
                    </div>
                    <div className="stat-pill-item">
                      <span className="stat-num">{dossierData?.demand?.totalViews || 0}</span>
                      <span className="stat-label">PG Listings Viewed</span>
                    </div>
                    <div className="stat-pill-item">
                      <span className="stat-num">{dossierData?.demand?.totalEnquiries || 0}</span>
                      <span className="stat-label">Leads Generated</span>
                    </div>
                  </div>

                  <div className="demand-subsections-grid">
                    <div className="demand-subcard">
                      <h5>Top Searched Areas</h5>
                      {dossierData?.demand?.topAreas?.length > 0 ? (
                        <ul className="ranked-mini-list">
                          {dossierData.demand.topAreas.map((item, idx) => (
                            <li key={item.name}>
                              <span>#{idx + 1} {item.name}</span>
                              <span className="count-tag">{item.count}x</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-subtext">No area searches recorded for this student.</p>
                      )}
                    </div>

                    <div className="demand-subcard">
                      <h5>Top Colleges Searched</h5>
                      {dossierData?.demand?.topColleges?.length > 0 ? (
                        <ul className="ranked-mini-list">
                          {dossierData.demand.topColleges.map((item, idx) => (
                            <li key={item.name}>
                              <span>#{idx + 1} {item.name}</span>
                              <span className="count-tag">{item.count}x</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-subtext">No college searches recorded for this student.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminDetailModal>
      )}

      {/* Verify/Unverify Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={verifyDialogState.isOpen}
        onClose={() => setVerifyDialogState({ isOpen: false, student: null, targetVerified: false, loading: false })}
        onConfirm={handleConfirmVerification}
        title={verifyDialogState.targetVerified ? 'Verify Student Profile' : 'Revoke Student Verification'}
        message={
          verifyDialogState.targetVerified
            ? `Are you sure you want to mark ${verifyDialogState.student?.full_name} as a verified student? This will grant verified trust signals.`
            : `Are you sure you want to revoke verification for ${verifyDialogState.student?.full_name}?`
        }
        confirmLabel={verifyDialogState.targetVerified ? 'Verify Profile' : 'Revoke Verification'}
        isDestructive={!verifyDialogState.targetVerified}
        loading={verifyDialogState.loading}
        notesPlaceholder="Provide reason or audit documentation for this verification change..."
      />
    </div>
  );
}
