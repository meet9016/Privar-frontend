import React from 'react';

/* Unique skeleton shimmer row */
function SkeletonRow({ columns }) {
  const widths = ['w-32', 'w-24', 'w-40', 'w-20', 'w-28', 'w-16', 'w-36'];
  return (
    <tr className="border-b border-border animate-pulse">
      {columns.map((col, idx) => (
        <td key={idx} className="p-4">
          <div className={`flex ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'items-center gap-3'}`}>
            {idx === 0 && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-border via-surface-secondary to-border flex-shrink-0" />
            )}
            <div className="space-y-2 flex-1">
              <div className={`h-3 rounded-full bg-gradient-to-r from-border via-surface-secondary to-border ${widths[idx % widths.length]}`} />
              {idx === 0 && <div className="h-2.5 rounded-full bg-border/60 w-20" />}
            </div>
          </div>
        </td>
      ))}
    </tr>
  );
}

export default function Table({
  columns,
  data,
  keyField = 'id',
  emptyState,
  pagination,
  loading = false,
  className = '',
  maxHeightClass = '',
  stickyHeader = false
}) {
  const skeletonRows = [1, 2, 3, 4, 5];

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden shadow-glass-sm flex flex-col ${className}`}>
      {data.length === 0 && !loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
          {emptyState?.icon && React.createElement(emptyState.icon, { className: 'w-12 h-12 text-text-secondary' })}
          <div>
            <h4 className="font-semibold text-text">{emptyState?.title || 'No records found'}</h4>
            <p className="text-text-secondary text-sm mt-1">
              {emptyState?.description || 'Try expanding your search criteria or add a new record'}
            </p>
          </div>
        </div>
      ) : (
        <div className={`overflow-x-auto custom-scrollbar ${maxHeightClass}`}>
          <table className="w-full text-left border-collapse">
            <thead className={stickyHeader ? "sticky top-0 z-10 bg-surface shadow-sm" : ""}>
              <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold tracking-wider">
                {columns.map((col, idx) => (
                  <th key={col.key || idx} className={`p-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                skeletonRows.map((n) => <SkeletonRow key={n} columns={columns} />)
              ) : (
                data.map((row, i) => (
                  <tr key={row[keyField] || i} className="hover:bg-surface-secondary text-sm text-text-secondary transition-colors">
                    {columns.map((col, idx) => (
                      <td key={col.key || idx} className={`p-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                        {col.render ? col.render(row, i) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (pagination.totalPages > 1 || pagination.total > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-surface-secondary/40 text-sm">
          <span className="text-text-secondary">
            Page {pagination.currentPage} of {pagination.totalPages} {pagination.total ? `(${pagination.total} total)` : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pagination.loading || pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange((current) => Math.max(1, current - 1))}
              className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-surface-secondary"
            >
              Previous
            </button>
            {pagination.pageNumbers?.map((item) => (
              <button
                key={item}
                type="button"
                disabled={pagination.loading || item === pagination.currentPage}
                onClick={() => pagination.onPageChange(item)}
                className={`min-w-10 px-3 py-2 rounded-lg border transition-colors ${
                  item === pagination.currentPage
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-card text-text hover:bg-surface-secondary'
                } disabled:cursor-not-allowed`}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              disabled={pagination.loading || pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange((current) => Math.min(pagination.totalPages, current + 1))}
              className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-surface-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
