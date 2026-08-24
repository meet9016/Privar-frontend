import React from 'react'
import { Filter, X, Check, RotateCcw } from 'lucide-react'

export default function FilterPopover({
  isOpen,
  onToggle,
  onClose,
  title = 'Filter Options',
  activeCount = 0,
  onClear,
  onApply,
  children,
  width = 'w-[300px]',
  className = ''
}) {
  return (
    <div className={`relative z-30 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex items-center justify-center h-10 px-3 rounded-lg border transition-all duration-200 cursor-pointer select-none bg-primary text-white border-primary shadow-sm hover:bg-primary-dark ${
          isOpen || activeCount > 0
            ? 'ring-2 ring-primary/20'
            : ''
        }`}
        title="Filter Records"
      >
        <Filter className="w-4 h-4" />
        {activeCount > 0 && (
          <span className="ml-1.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold rounded-full bg-white text-primary ring-2 ring-primary">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-200"
            onClick={onClose}
          />

          {/* Modern Sleek Filter Card */}
          <div
            className={`absolute right-0 top-full mt-2 ${width} bg-surface border border-border rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text">{title}</span>
                {activeCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {activeCount} applied
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {onClear && activeCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      try {
                        if (onClear) onClear(e)
                      } catch (err) {
                        console.error('Error clearing filters:', err)
                      }
                    }}
                    className="text-[11px] font-medium text-text-secondary hover:text-error transition-colors px-1.5 py-0.5 rounded cursor-pointer"
                    title="Clear All Filters"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-surface-secondary transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* Footer with Clear & Apply */}
            <div className="px-4 py-3 bg-surface-secondary/40 border-t border-border flex items-center gap-2">
              {onClear && (
                <button
                  type="button"
                  onClick={(e) => {
                    try {
                      if (onClear) onClear(e)
                    } catch (err) {
                      console.error('Error clearing filters:', err)
                    }
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-secondary border border-border text-text-secondary hover:text-text transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  if (onClose) onClose(e)
                  try {
                    if (onApply) onApply(e)
                  } catch (err) {
                    console.error('Error applying filters:', err)
                  }
                }}
                className={`${onClear ? 'flex-1' : 'w-full'} py-2 px-4 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]`}
              >
                <Check className="w-3.5 h-3.5" /> Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
