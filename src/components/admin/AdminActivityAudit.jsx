import { useState, useEffect, useCallback } from 'react';
import { 
  IconActivity, 
  IconRefreshCw, 
  IconMapPin, 
  IconGraduationCap, 
  IconEye, 
  IconHeart, 
  IconClock
} from '../Icons';
import { getPlatformActivity, getSearchDemandSummary } from '../../lib/adminService';
import './AdminShell.css';

export default function AdminActivityAudit() {
  const [activities, setActivities] = useState([]);
  const [demandSummary, setDemandSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all'); // all, student, owner, admin
  const [actionCategory, setActionCategory] = useState('all'); // all, searches, views, leads, moderation
  const [activeTab, setActiveTab] = useState('stream'); // stream, demand
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const [activityRes, demandRes] = await Promise.all([
        getPlatformActivity({
          limit: 100,
          actorRole: roleFilter === 'all' ? null : roleFilter,
        }),
        getSearchDemandSummary(),
      ]);

      setActivities(activityRes.activities || []);
      setDemandSummary(demandRes);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPlatformActivity({
        limit: 100,
        actorRole: roleFilter === 'all' ? null : roleFilter,
      }),
      getSearchDemandSummary(),
    ]).then(([activityRes, demandRes]) => {
      if (isMounted) {
        setActivities(activityRes.activities || []);
        setDemandSummary(demandRes);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load activity logs:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [roleFilter]);

  // Client-side category filtering
  const filteredActivities = activities.filter(act => {
    if (actionCategory === 'searches') {
      return act.action.includes('search') || act.action.includes('selected');
    }
    if (actionCategory === 'views') {
      return act.action.includes('view') || act.action.includes('favourite');
    }
    if (actionCategory === 'leads') {
      return act.action.includes('enquiry') || act.action.includes('review');
    }
    if (actionCategory === 'moderation') {
      return act.action.includes('pg_') || act.action.includes('report_') || act.action.includes('verified');
    }
    return true;
  });

  const getActionBadgeClass = (action) => {
    if (action.includes('favourite')) return 'badge-rose';
    if (action.includes('enquiry')) return 'badge-indigo';
    if (action.includes('approved') || action.includes('verified')) return 'badge-emerald';
    if (action.includes('report') || action.includes('rejected')) return 'badge-rose';
    if (action.includes('search') || action.includes('selected')) return 'badge-amber';
    return 'badge-neutral';
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return 'role-tag-admin';
    if (role === 'owner') return 'role-tag-owner';
    return 'role-tag-student';
  };

  return (
    <div className="admin-activity-view">
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Activity Audit &amp; Data Intelligence</h2>
          <p className="view-subtitle">
            Cryptographic event trail recorded in public.activity_logs. Zero passwords, secrets, or auth tokens are captured.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={fetchAuditData}
          disabled={loading}
        >
          <IconRefreshCw className={`w-4 h-4 ${loading ? 'spinner' : ''}`} />
          <span>Sync Logs</span>
        </button>
      </div>

      {/* Main Mode Switcher */}
      <div className="activity-view-tabs">
        <button
          type="button"
          className={`activity-tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
          onClick={() => setActiveTab('stream')}
        >
          <IconActivity className="w-4 h-4" />
          <span>Real-Time Audit Stream ({filteredActivities.length})</span>
        </button>
        <button
          type="button"
          className={`activity-tab-btn ${activeTab === 'demand' ? 'active' : ''}`}
          onClick={() => setActiveTab('demand')}
        >
          <IconMapPin className="w-4 h-4" />
          <span>Student Demand Intelligence</span>
        </button>
      </div>

      {activeTab === 'stream' && (
        <div className="audit-stream-container">
          {/* Filter Bar */}
          <div className="audit-filters-bar">
            <div className="filter-group">
              <span className="filter-group-label">Actor Role:</span>
              {['all', 'student', 'owner', 'admin'].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`table-filter-pill ${roleFilter === r ? 'active' : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Event Domain:</span>
              {[
                { id: 'all', label: 'All Events' },
                { id: 'searches', label: 'Searches & Navigation' },
                { id: 'views', label: 'Views & Wishlists' },
                { id: 'leads', label: 'Enquiries & Leads' },
                { id: 'moderation', label: 'Admin Moderation' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`table-filter-pill ${actionCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActionCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Events List */}
          <div className="audit-events-wrapper">
            {loading ? (
              <div className="table-loading-skeleton">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="skeleton-row" />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="queue-empty-state">
                <IconActivity className="w-8 h-8 text-dim" />
                <h4>No Matching Activity Logs</h4>
                <p>No logged events match the selected actor or category filters.</p>
              </div>
            ) : (
              <div className="audit-events-list">
                {filteredActivities.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;

                  return (
                    <div key={log.id} className="audit-event-card">
                      <div 
                        className="audit-card-main-row"
                        onClick={() => hasMeta && setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <div className="audit-actor-block">
                          <span className={`role-badge-pill ${getRoleBadgeClass(log.actor_role)}`}>
                            {log.actor_role.toUpperCase()}
                          </span>
                          <span className="actor-name-text">
                            {log.actor?.full_name || 'Visitor'}
                          </span>
                          {log.actor?.email && (
                            <span className="actor-email-text">{log.actor.email}</span>
                          )}
                        </div>

                        <div className="audit-action-block">
                          <span className={`activity-action-tag ${getActionBadgeClass(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          {log.target_type && (
                            <span className="target-type-chip">
                              {log.target_type}
                            </span>
                          )}
                        </div>

                        <div className="audit-timestamp-block">
                          <IconClock className="w-3.5 h-3.5 text-dim" />
                          <span>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                        </div>

                        {hasMeta && (
                          <button
                            type="button"
                            className="btn-toggle-meta"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLogId(isExpanded ? null : log.id);
                            }}
                          >
                            {isExpanded ? 'Hide Payload' : 'View Payload'}
                          </button>
                        )}
                      </div>

                      {/* Expandable JSON Metadata inspector */}
                      {isExpanded && (
                        <div className="audit-metadata-drawer">
                          <div className="meta-drawer-header">
                            <span>Sanitized Metadata Payload (Immutable Log ID: {log.id})</span>
                          </div>
                          <pre className="meta-payload-code">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demand Intelligence Tab */}
      {activeTab === 'demand' && (
        <div className="demand-intelligence-tab">
          <div className="demand-summary-banner">
            <div className="banner-icon-bubble">
              <IconMapPin className="w-6 h-6 text-indigo" />
            </div>
            <div>
              <h3>Student Demand Intelligence Radar</h3>
              <p>
                Aggregated student interest computed authentically from discovery search events, college proximities, and PG wishlist signals.
              </p>
            </div>
          </div>

          <div className="demand-snapshot-grid">
            {/* Top Searched Areas */}
            <div className="demand-col">
              <div className="demand-col-header">
                <IconMapPin className="w-4 h-4 text-indigo" />
                <h4>Top Student Search Hubs</h4>
              </div>
              {demandSummary?.mostSearchedAreas?.length > 0 ? (
                <ul className="demand-ranked-list">
                  {demandSummary.mostSearchedAreas.map((item, idx) => (
                    <li key={item.name} className="demand-ranked-item">
                      <span className="rank-num">#{idx + 1}</span>
                      <span className="rank-name">{item.name}</span>
                      <span className="rank-count">{item.count} searches</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="demand-empty-col">
                  <p>No area search telemetry recorded yet.</p>
                </div>
              )}
            </div>

            {/* Top Colleges */}
            <div className="demand-col">
              <div className="demand-col-header">
                <IconGraduationCap className="w-4 h-4 text-violet" />
                <h4>Top Target Colleges</h4>
              </div>
              {demandSummary?.mostSearchedColleges?.length > 0 ? (
                <ul className="demand-ranked-list">
                  {demandSummary.mostSearchedColleges.map((item, idx) => (
                    <li key={item.name} className="demand-ranked-item">
                      <span className="rank-num">#{idx + 1}</span>
                      <span className="rank-name">{item.name}</span>
                      <span className="rank-count">{item.count} searches</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="demand-empty-col">
                  <p>No college search telemetry recorded yet.</p>
                </div>
              )}
            </div>

            {/* Most Viewed PGs */}
            <div className="demand-col">
              <div className="demand-col-header">
                <IconEye className="w-4 h-4 text-amber" />
                <h4>Most Viewed PG Properties</h4>
              </div>
              {demandSummary?.mostViewedPGs?.length > 0 ? (
                <ul className="demand-ranked-list">
                  {demandSummary.mostViewedPGs.map((item, idx) => (
                    <li key={item.name} className="demand-ranked-item">
                      <span className="rank-num">#{idx + 1}</span>
                      <span className="rank-name">{item.name}</span>
                      <span className="rank-count">{item.count} views</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="demand-empty-col">
                  <p>No listing view signals recorded yet.</p>
                </div>
              )}
            </div>

            {/* Most Favourited PGs */}
            <div className="demand-col">
              <div className="demand-col-header">
                <IconHeart className="w-4 h-4 text-rose" />
                <h4>Most Wishlisted Properties</h4>
              </div>
              {demandSummary?.mostFavouritedPGs?.length > 0 ? (
                <ul className="demand-ranked-list">
                  {demandSummary.mostFavouritedPGs.map((item, idx) => (
                    <li key={item.name} className="demand-ranked-item">
                      <span className="rank-num">#{idx + 1}</span>
                      <span className="rank-name">{item.name}</span>
                      <span className="rank-count">{item.count} saves</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="demand-empty-col">
                  <p>No student wishlist records captured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
