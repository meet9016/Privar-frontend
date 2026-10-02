import React, { useEffect, useRef } from 'react'
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
  width = 'w-[320px] sm:w-[580px]',
  className = ''
}) {
  const containerRef = useRef(null)

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative flex items-center justify-center h-10 px-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-primary text-white border-primary shadow-xs hover:bg-primary-dark ${
          isOpen || activeCount > 0
            ? 'ring-2 ring-primary/30'
            : ''
        }`}
        title="Filter Records"
      >
        <Filter className="w-4 h-4" />
        {activeCount > 0 && (
          <span className="ml-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold rounded-full bg-white text-primary ring-2 ring-primary">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Click Outside Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Popover anchored directly below the filter button */}
          <div
            className={`absolute top-full right-0 mt-2.5 ${width} max-w-[92vw] bg-card border border-border/90 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden flex flex-col max-h-[85vh]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-b border-border shrink-0">
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
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>

            {/* Footer with Clear & Apply */}
            <div className="px-5 py-3.5 bg-surface-secondary/40 border-t border-border flex items-center gap-2.5 shrink-0">
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
                  className="flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-card hover:bg-surface-secondary border border-border text-text-secondary hover:text-text transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
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
                className={`${onClear ? 'flex-1' : 'w-full'} py-2.5 px-4 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]`}
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
