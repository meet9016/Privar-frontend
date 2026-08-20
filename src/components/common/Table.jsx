import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, FolderOpen, CheckSquare, Square, MinusSquare, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Checkbox from './Checkbox';

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
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${(limit || 10) === opt
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
function SkeletonRow({ columns }) {
  const textWidths = ['w-36', 'w-24', 'w-32', 'w-20', 'w-28', 'w-16'];
  return (
    <tr className="border-b border-border/70 animate-pulse">
      {columns.map((col, idx) => {
        const isCheckbox = col.key === 'select' || col.className?.includes('w-12') || col.className?.includes('w-10');
        const isAction = col.key === 'actions' || col.key === 'action';
        const isImage = col.key === 'image' || col.key === 'student' || col.key === 'member';

        return (
          <td key={col.key || idx} className={`p-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
            {isCheckbox ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-surface-secondary border border-border/80" />
              </div>
            ) : isAction ? (
              <div className="flex items-center justify-end gap-2">
                <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-border/60" />
                <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-border/60" />
              </div>
            ) : isImage ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border/60 shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-[160px]">
                  <div className="h-3 rounded-full bg-surface-secondary w-28" />
                  <div className="h-2 rounded-full bg-surface-secondary/70 w-16" />
                </div>
              </div>
            ) : (
              <div className={`flex ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'items-center'}`}>
                <div className={`h-3 rounded-full bg-surface-secondary ${textWidths[idx % textWidths.length]}`} />
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

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
  data = [],
  keyField = 'id',
  emptyState,
  pagination,
  loading = false,
  showSkeleton = false,
  className = '',
  maxHeightClass = 'max-h-[620px]',
  stickyHeader = true,
  rowClassName,
  // Checkbox selection & Bulk Actions (Default false as requested)
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onBulkStatus,
  onBulkDelete,
  hasStatusColumn
}) {
  const skeletonRows = [1, 2, 3, 4, 5];

  // Local selection fallback if not controlled from parent
  const [localSelected, setLocalSelected] = useState([]);
  const effectiveSelected = onSelectionChange ? selectedRows : localSelected;
  const setEffectiveSelected = (updater) => {
    const next = typeof updater === 'function' ? updater(effectiveSelected) : updater;
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setLocalSelected(next);
    }
  };

  const getRowId = (row) => String(row[keyField] || row._id || row.id);

  const allPageIds = useMemo(() => data.map(getRowId), [data, keyField]);
  const isAllSelected = data.length > 0 && allPageIds.every(id => effectiveSelected.includes(id));
  const isIndeterminate = !isAllSelected && allPageIds.some(id => effectiveSelected.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setEffectiveSelected(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      setEffectiveSelected(prev => Array.from(new Set([...prev, ...allPageIds])));
    }
  };

  const toggleRow = (id) => {
    setEffectiveSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const showStatusBulk = hasStatusColumn ?? columns.some(c => c.key === 'status' || c.header?.toLowerCase()?.includes('status'));

  const finalColumns = useMemo(() => {
    if (!selectable) return columns;
    const selectColumn = {
      key: '__table_selection_col',
      headerRender: () => (
        <div className="flex items-center justify-center pl-1">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={el => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-input-bg cursor-pointer transition-colors"
          />
        </div>
      ),
      className: 'w-12 text-center',
      render: (row) => {
        const id = getRowId(row);
        const isChecked = effectiveSelected.includes(id);
        return (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleRow(id)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-input-bg cursor-pointer transition-colors"
            />
          </div>
        );
      }
    };
    return [selectColumn, ...columns];
  }, [columns, selectable, isAllSelected, isIndeterminate, effectiveSelected, data]);

  const smartPageNumbers = useMemo(() => {
    if (!pagination) return [];
    return getPageNumbers(pagination.currentPage || 1, pagination.totalPages || 1);
  }, [pagination?.currentPage, pagination?.totalPages]);
  const totalRecords = pagination ? (pagination.total || 0) : data.length;
  const showingFrom = pagination ? (totalRecords === 0 ? 0 : ((pagination.currentPage - 1) * (pagination.limit || 10)) + 1) : (data.length === 0 ? 0 : 1);
  const showingTo = pagination ? Math.min(showingFrom + (pagination.limit || 10) - 1, totalRecords) : data.length;

  return (
    <div className={`bg-white border border-border rounded-2xl overflow-hidden shadow-glass-sm flex flex-col ${className}`}>
      <div className={`overflow-x-auto overflow-y-auto custom-scrollbar ${maxHeightClass}`}>
        <table className="w-full min-w-full text-left border-collapse table-auto bg-white">
          <thead className={stickyHeader ? "sticky top-0 z-10 shadow-sm" : ""}>
            <tr className="border-b border-primary/20 text-text text-xs uppercase tracking-wider font-bold bg-primary-bg">
              {finalColumns.map((col, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === finalColumns.length - 1;
                const paddingClass = isFirst ? 'pl-6 pr-4 py-3.5' : isLast ? 'pl-4 pr-6 py-3.5' : 'px-4 py-3.5';
                return (
                  <th key={col.key || idx} className={`${paddingClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                    {col.headerRender ? col.headerRender() : col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={`divide-y divide-border bg-white transition-opacity duration-150 ${loading && data.length > 0 ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
            {loading && data.length === 0 ? (
              showSkeleton ? (
                skeletonRows.map((n) => <SkeletonRow key={n} columns={finalColumns} />)
              ) : (
                <tr>
                  <td colSpan={finalColumns.length} className="py-20 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full border-3 border-primary/20 border-t-primary animate-spin"></div>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary tracking-wide">Loading data, please wait...</span>
                    </div>
                  </td>
                </tr>
              )
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={finalColumns.length} className="p-0">
                  <div className="relative flex flex-col items-center justify-center min-h-[300px] p-8 text-center overflow-hidden">
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                      {emptyState?.icon ? (
                        React.createElement(emptyState.icon, { className: 'w-8 h-8 text-primary relative z-10' })
                      ) : (
                        <FolderOpen className="w-8 h-8 text-primary relative z-10" />
                      )}
                    </div>

                    <h4 className="relative z-10 text-base font-bold text-text tracking-wide mb-1">
                      {emptyState?.title || 'No records found'}
                    </h4>
                    <p className="relative z-10 text-text-secondary text-xs max-w-sm font-medium leading-relaxed mb-1">
                      {emptyState?.description || 'Try expanding your search criteria or add a new record.'}
                    </p>

                    {emptyState?.onAction && (
                      <button
                        type="button"
                        onClick={emptyState.onAction}
                        className="relative z-10 mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-glow-primary transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <span className="text-sm font-bold leading-none">+</span>
                        <span>{emptyState.actionLabel || 'Add New'}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const id = getRowId(row);
                const isSelected = effectiveSelected.includes(id);
                return (
                  <tr
                    key={row[keyField] || i}
                    className={`hover:bg-surface-secondary/40 text-[13px] font-medium text-text transition-colors ${isSelected ? 'bg-primary/5' : ''} ${rowClassName ? rowClassName(row, i) : ''}`}
                  >
                    {finalColumns.map((col, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === finalColumns.length - 1;
                      const paddingClass = isFirst ? 'pl-6 pr-4 py-1.5' : isLast ? 'pl-4 pr-6 py-1.5' : 'px-4 py-1.5';
                      return (
                        <td key={col.key || idx} className={`${paddingClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}>
                          {col.render ? col.render(row, i) : row[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {effectiveSelected.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-primary/10 border-t border-primary/20 animate-fade-in text-text">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-bold">{effectiveSelected.length}</span>
            <span>items selected</span>
            <button
              type="button"
              onClick={() => setEffectiveSelected([])}
              className="text-text-secondary hover:text-text text-xs underline ml-2 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            {showStatusBulk && onBulkStatus && (
              <>
                <button
                  type="button"
                  onClick={() => onBulkStatus(effectiveSelected, 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active</span>
                </button>
                <button
                  type="button"
                  onClick={() => onBulkStatus(effectiveSelected, 0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Deactive</span>
                </button>
              </>
            )}

            {onBulkDelete && (
              <button
                type="button"
                onClick={() => onBulkDelete(effectiveSelected)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-bg hover:bg-error/20 text-error-text border border-error-border text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
      {pagination && (
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
              Showing <span className="font-semibold text-text">{showingFrom}</span> to <span className="font-semibold text-text">{showingTo}</span> of <span className="font-semibold text-text">{totalRecords}</span>
            </span>
          </div>
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
                  className={`min-w-8 h-8 px-2 rounded-lg border text-sm font-medium transition-all ${item === pagination.currentPage
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
