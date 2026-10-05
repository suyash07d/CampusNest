import { IconSearch, IconFilter } from '../Icons';
import './AdminShell.css';

export default function AdminDataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no database entries matching the current filter criteria.',
  emptyIcon: EmptyIcon,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  filterOptions = [],
  activeFilter = '',
  onFilterChange,
  onRowClick,
  customHeaderRight,
}) {
  return (
    <div className="admin-data-container">
      {/* Top Filter and Search Bar */}
      {(onSearchChange || filterOptions.length > 0 || customHeaderRight) && (
        <div className="admin-table-toolbar">
          {filterOptions.length > 0 && (
            <div className="table-filter-tabs">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`table-filter-pill ${activeFilter === opt.key ? 'active' : ''}`}
                  onClick={() => onFilterChange?.(opt.key)}
                >
                  <span>{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="pill-badge">{opt.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="table-toolbar-right">
            {onSearchChange && (
              <div className="table-search-box">
                <IconSearch className="w-4 h-4 search-icon" />
                <input
                  type="search"
                  className="table-search-input"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label={searchPlaceholder}
                />
              </div>
            )}
            {customHeaderRight}
          </div>
        </div>
      )}

      {/* Main Table / Card View Area */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="table-loading-skeleton" aria-label="Loading data">
            <div className="skeleton-row-header" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-row" style={{ opacity: 1 - i * 0.12 }}>
                <div className="skeleton-cell cell-md" />
                <div className="skeleton-cell cell-lg" />
                <div className="skeleton-cell cell-sm" />
                <div className="skeleton-cell cell-sm" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon-wrap">
              {EmptyIcon ? <EmptyIcon className="w-7 h-7 text-dim" /> : <IconFilter className="w-7 h-7 text-dim" />}
            </div>
            <h4 className="empty-title">{emptyTitle}</h4>
            <p className="empty-message">{emptyMessage}</p>
          </div>
        ) : (
          <div className="table-responsive-scroll">
            <table className="admin-data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.align || 'left' }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={`table-body-row ${onRowClick ? 'clickable' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table Footer info */}
      {!loading && data.length > 0 && (
        <div className="admin-table-footer">
          <span className="footer-count-text">
            Showing <strong>{data.length}</strong> real database {data.length === 1 ? 'record' : 'records'}
          </span>
          <span className="footer-rls-text">Protected by PostgreSQL RLS</span>
        </div>
      )}
    </div>
  );
}
