import { useState, useEffect } from 'react';
import { 
  IconGraduationCap, 
  IconBuilding, 
  IconHome, 
  IconClock, 
  IconCheckCircle, 
  IconMail, 
  IconAlertTriangle, 
  IconActivity,
  IconRefreshCw,
  IconArrowRight,
  IconMapPin,
  IconEye,
  IconHeart, 
  IconTrendingUp
} from '../Icons';
import AdminMetricCard from './AdminMetricCard';
import { 
  getOverviewMetrics, 
  getPlatformActivity, 
  getPGListings, 
  getSearchDemandSummary 
} from '../../lib/adminService';
import './AdminShell.css';

export default function AdminOverview({ onNavigate, onReviewPG }) {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalOwners: 0,
    totalPGs: 0,
    pendingPGs: 0,
    approvedPGs: 0,
    totalEnquiries: 0,
    openReports: 0,
    totalActivityLogs: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [demandSummary, setDemandSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getOverviewMetrics(),
      getPlatformActivity({ limit: 8 }),
      getPGListings({ status: 'pending', limit: 5 }),
      getSearchDemandSummary(),
    ]).then(([metricsData, activityData, pendingPGsData, demandData]) => {
      if (isMounted) {
        setMetrics(metricsData);
        setRecentActivities(activityData.activities || []);
        setPendingListings(pendingPGsData.listings || []);
        setDemandSummary(demandData);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load admin overview data:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [metricsData, activityData, pendingPGsData, demandData] = await Promise.all([
        getOverviewMetrics(),
        getPlatformActivity({ limit: 8 }),
        getPGListings({ status: 'pending', limit: 5 }),
        getSearchDemandSummary(),
      ]);
      setMetrics(metricsData);
      setRecentActivities(activityData.activities || []);
      setPendingListings(pendingPGsData.listings || []);
      setDemandSummary(demandData);
    } catch (err) {
      console.error('Failed to refresh admin overview data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('favourite')) return 'badge-rose';
    if (action.includes('enquiry')) return 'badge-indigo';
    if (action.includes('approved') || action.includes('verified')) return 'badge-emerald';
    if (action.includes('report') || action.includes('rejected')) return 'badge-rose';
    if (action.includes('search')) return 'badge-amber';
    return 'badge-neutral';
  };

  const metricCards = [
    {
      title: 'Total Students',
      value: metrics.totalStudents,
      sublabel: 'View all student dossiers',
      icon: IconGraduationCap,
      color: 'indigo',
      onClick: () => onNavigate?.('students'),
    },
    {
      title: 'Total Owners',
      value: metrics.totalOwners,
      sublabel: 'View property owners',
      icon: IconBuilding,
      color: 'violet',
      onClick: () => onNavigate?.('owners'),
    },
    {
      title: 'Total PG Listings',
      value: metrics.totalPGs,
      sublabel: 'Manage all properties',
      icon: IconHome,
      color: 'neutral',
      onClick: () => onNavigate?.('pgs'),
    },
    {
      title: 'Pending Review',
      value: metrics.pendingPGs,
      sublabel: metrics.pendingPGs > 0 ? 'Requires moderation' : 'Queue clear',
      icon: IconClock,
      color: 'amber',
      badge: metrics.pendingPGs > 0 ? 'Action needed' : 'Clear',
      onClick: () => onNavigate?.('pgs'),
    },
    {
      title: 'Approved PGs',
      value: metrics.approvedPGs,
      sublabel: 'Live on discovery map',
      icon: IconCheckCircle,
      color: 'emerald',
      onClick: () => onNavigate?.('pgs'),
    },
    {
      title: 'Student Enquiries',
      value: metrics.totalEnquiries,
      sublabel: 'Lead correspondence',
      icon: IconMail,
      color: 'indigo',
      onClick: () => onNavigate?.('enquiries'),
    },
    {
      title: 'Open Reports',
      value: metrics.openReports,
      sublabel: metrics.openReports > 0 ? 'Trust & Safety review' : 'No active alerts',
      icon: IconAlertTriangle,
      color: 'rose',
      badge: metrics.openReports > 0 ? 'Urgent' : null,
      onClick: () => onNavigate?.('reports'),
    },
    {
      title: 'Activity Events',
      value: metrics.totalActivityLogs,
      sublabel: 'Immutable audit trail',
      icon: IconActivity,
      color: 'violet',
      onClick: () => onNavigate?.('activity'),
    },
  ];

  return (
    <div className="admin-overview-view">
      {/* Top Banner and Quick Refresh */}
      <div className="view-header-strip">
        <div>
          <h2 className="view-title">Operations Command Center</h2>
          <p className="view-subtitle">
            Real-time platform telemetry, student engagement signals, and moderation workflows.
          </p>
        </div>
        <button
          type="button"
          className="btn-refresh-telemetry"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          title="Refresh metrics from Supabase database"
        >
          <IconRefreshCw className={`w-4 h-4 ${refreshing ? 'spinner' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="overview-metrics-grid">
        {metricCards.map((card, idx) => (
          <AdminMetricCard
            key={card.title}
            index={idx}
            title={card.title}
            value={card.value}
            sublabel={card.sublabel}
            icon={card.icon}
            color={card.color}
            badge={card.badge}
            onClick={card.onClick}
          />
        ))}
      </div>

      {/* Operational 3-Column Split */}
      <div className="overview-sections-grid">
        {/* Section A: PG Moderation Queue */}
        <div className="overview-card moderation-queue-card">
          <div className="overview-card-header">
            <div className="header-title-group">
              <IconHome className="w-5 h-5 text-amber" />
              <h3>PG Moderation Queue</h3>
            </div>
            <button
              type="button"
              className="btn-card-action"
              onClick={() => onNavigate?.('pgs')}
            >
              <span>View All</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overview-card-body">
            {loading ? (
              <div className="queue-loading-skeleton">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton-queue-item" />
                ))}
              </div>
            ) : pendingListings.length === 0 ? (
              <div className="queue-empty-state">
                <IconCheckCircle className="w-8 h-8 text-emerald" />
                <h4>Queue is Completely Clear</h4>
                <p>No PG listings are currently awaiting administrative review.</p>
              </div>
            ) : (
              <div className="queue-items-list">
                {pendingListings.map((listing) => (
                  <div key={listing.id} className="queue-item-row">
                    <div className="queue-item-main">
                      <div className="queue-item-title-row">
                        <span className="queue-pg-name">{listing.name}</span>
                        <span className="queue-badge-pending">Pending Review</span>
                      </div>
                      <div className="queue-item-meta">
                        <span>{listing.area?.name || 'Pune Area'}</span>
                        <span className="meta-bullet">•</span>
                        <span>Owner: {listing.owner?.full_name || 'Listing Owner'}</span>
                        <span className="meta-bullet">•</span>
                        <span>₹{listing.starting_monthly_rent?.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-review-queue"
                      onClick={() => onReviewPG ? onReviewPG(listing) : onNavigate?.('pgs')}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section B: Recent Platform Activity Stream */}
        <div className="overview-card activity-stream-card">
          <div className="overview-card-header">
            <div className="header-title-group">
              <IconActivity className="w-5 h-5 text-indigo" />
              <h3>Recent Platform Activity</h3>
            </div>
            <button
              type="button"
              className="btn-card-action"
              onClick={() => onNavigate?.('activity')}
            >
              <span>Full Audit</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overview-card-body">
            {loading ? (
              <div className="activity-loading-skeleton">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="skeleton-activity-item" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="queue-empty-state">
                <IconActivity className="w-8 h-8 text-dim" />
                <h4>No Activity Logs Yet</h4>
                <p>Platform user interactions will log securely here in real-time.</p>
              </div>
            ) : (
              <div className="activity-items-list">
                {recentActivities.map((act) => (
                  <div key={act.id} className="activity-stream-row">
                    <div className="activity-avatar-circle">
                      {(act.actor?.full_name || act.actor_role || 'U')[0].toUpperCase()}
                    </div>
                    <div className="activity-info-stack">
                      <div className="activity-first-line">
                        <span className="activity-actor-name">
                          {act.actor?.full_name || 'Authenticated User'}
                        </span>
                        <span className={`activity-action-tag ${getActionBadgeClass(act.action)}`}>
                          {act.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="activity-timestamp">{formatTimestamp(act.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section C: Student Demand Snapshot */}
      <div className="overview-card demand-snapshot-card">
        <div className="overview-card-header">
          <div className="header-title-group">
            <IconTrendingUp className="w-5 h-5 text-emerald" />
            <h3>Student Demand Intelligence Snapshot</h3>
          </div>
          <span className="header-pill-tag">Real-Time Search Telemetry</span>
        </div>

        <div className="demand-snapshot-grid">
          {/* Top Searched Areas */}
          <div className="demand-col">
            <div className="demand-col-header">
              <IconMapPin className="w-4 h-4 text-indigo" />
              <h4>Top Searched Areas</h4>
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
                <p>No area search data recorded yet.</p>
              </div>
            )}
          </div>

          {/* Top Searched Colleges */}
          <div className="demand-col">
            <div className="demand-col-header">
              <IconGraduationCap className="w-4 h-4 text-violet" />
              <h4>Top Colleges of Interest</h4>
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
                <p>No college search data recorded yet.</p>
              </div>
            )}
          </div>

          {/* Most Viewed PGs */}
          <div className="demand-col">
            <div className="demand-col-header">
              <IconEye className="w-4 h-4 text-amber" />
              <h4>Most Viewed Properties</h4>
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
                <p>No listing views recorded yet.</p>
              </div>
            )}
          </div>

          {/* Most Favourited PGs */}
          <div className="demand-col">
            <div className="demand-col-header">
              <IconHeart className="w-4 h-4 text-rose" />
              <h4>Most Favourited PGs</h4>
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
                <p>No PG wishlist saves recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
