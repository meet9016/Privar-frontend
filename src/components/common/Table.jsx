import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

/* Custom Theme-Aware Rows Selector Dropdown */
function RowsSelector({ limit, onLimitChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [10, 25, 50, 100];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-card border border-border text-text font-semibold text-xs rounded-lg px-2.5 py-1.5 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm cursor-pointer"
      >
        <span>{limit || 10}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-20 bg-card border border-border rounded-lg shadow-glass py-1 z-30 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLimitChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${
                (limit || 10) === opt
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-text hover:bg-surface-secondary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

/* Generate smart page numbers with ellipsis */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default function Table({
  columns,
  data,
  keyField = 'id',
  emptyState,
  pagination,
  loading = false,
  className = '',
  maxHeightClass = 'max-h-[600px] overflow-y-auto',
  stickyHeader = true,
  rowClassName
}) {
  const skeletonRows = [1, 2, 3, 4, 5];

  const smartPageNumbers = useMemo(() => {
    if (!pagination) return [];
    return getPageNumbers(pagination.currentPage || 1, pagination.totalPages || 1);
  }, [pagination?.currentPage, pagination?.totalPages]);

  // Calculate "Showing X to Y of Z"
  const showingFrom = pagination ? ((pagination.currentPage - 1) * (pagination.limit || 10)) + 1 : 1;
  const showingTo = pagination ? Math.min(showingFrom + (pagination.limit || 10) - 1, pagination.total || 0) : data.length;

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
                  <th key={col.key || idx} className={`p-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                    {col.headerRender ? col.headerRender() : col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                skeletonRows.map((n) => <SkeletonRow key={n} columns={columns} />)
              ) : (
                data.map((row, i) => (
                  <tr key={row[keyField] || i} className={`hover:bg-surface-secondary text-sm text-text-secondary transition-colors ${rowClassName ? rowClassName(row, i) : ''}`}>
                    {columns.map((col, idx) => (
                      <td key={col.key || idx} className={`p-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
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

      {/* Pagination Footer */}
      {pagination && (pagination.totalPages > 1 || pagination.total > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-border bg-surface-secondary/40 text-sm">
          {/* Left: Rows selector + Showing info */}
          <div className="flex items-center gap-4">
            {pagination.onLimitChange && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary font-medium text-xs uppercase tracking-wide">Rows</span>
                <RowsSelector limit={pagination.limit} onLimitChange={pagination.onLimitChange} />
              </div>
            )}
            <span className="text-text-secondary">
              Showing <span className="font-semibold text-text">{showingFrom}</span> to <span className="font-semibold text-text">{showingTo}</span> of <span className="font-semibold text-text">{pagination.total || 0}</span>
            </span>
          </div>

          {/* Right: Pagination buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.loading || pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange((current) => Math.max(1, current - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-surface-secondary hover:text-text"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {smartPageNumbers.map((item, idx) => (
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-text-secondary text-xs">...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={pagination.loading || item === pagination.currentPage}
                  onClick={() => pagination.onPageChange(item)}
                  className={`min-w-8 h-8 px-2 rounded-lg border text-sm font-medium transition-all ${
                    item === pagination.currentPage
                      ? 'border-primary bg-primary text-white shadow-glow-primary disabled:opacity-100 disabled:cursor-default'
                      : 'border-border bg-card text-text hover:bg-surface-secondary disabled:cursor-not-allowed'
                  }`}
                >
                  {item}
                </button>
              )
            ))}

            <button
              type="button"
              disabled={pagination.loading || pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange((current) => Math.min(pagination.totalPages, current + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-surface-secondary hover:text-text"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
