import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function MultiSelect({
  label,
  options = [],
  values = [],
  onChange,
  error,
  required,
  placeholder = 'Select members...',
  searchable = true,
  disabled = false,
  className = '',
  maxDisplay = 2
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedValues = Array.isArray(values) ? values.map(String) : [];

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuMaxHeight = 480; // Large popup height to comfortably show 10+ items

    const isDropUp = spaceBelow < 350 && spaceAbove > spaceBelow;
    const availableHeight = isDropUp ? spaceAbove - 16 : spaceBelow - 16;
    const calculatedMaxHeight = Math.max(280, Math.min(menuMaxHeight, availableHeight));

    if (isDropUp) {
      setMenuStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${calculatedMaxHeight}px`,
        zIndex: 999999,
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${calculatedMaxHeight}px`,
        zIndex: 999999,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchTerm('');
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleToggle = (val) => {
    const valStr = String(val);
    const targetOpt = options.find(opt => String(opt.value) === valStr);
    
    // Check if this option has linked children or related family member ids
    const linkedIds = (targetOpt && Array.isArray(targetOpt.child_ids) && targetOpt.child_ids.length > 0)
      ? [valStr, ...targetOpt.child_ids.map(String)]
      : [valStr];

    if (selectedValues.includes(valStr)) {
      // Deselect option and linked children
      onChange(selectedValues.filter(id => !linkedIds.includes(String(id))));
    } else {
      // Select option and linked children
      const newSet = new Set([...selectedValues, ...linkedIds]);
      onChange(Array.from(newSet));
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => String(opt.value)));
    }
  };

  const filteredOptions = options.filter(option =>
    String(option.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(option.subtext || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter(opt => selectedValues.includes(String(opt.value)));

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full" ref={triggerRef}>
        <div
          className={`w-full min-h-[42px] px-3 py-1.5 bg-input-bg text-text border ${
            error ? 'border-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
          }`}
          onClick={toggleOpen}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden py-0.5">
            {selectedOptions.length === 0 ? (
              <span className="text-text-secondary text-sm">{placeholder}</span>
            ) : selectedOptions.length <= maxDisplay ? (
              selectedOptions.map(opt => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                >
                  <span className="truncate max-w-[120px]">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(opt.value);
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {selectedOptions.length} members selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="p-1 text-text-secondary hover:text-red-500 rounded-md transition-colors"
                title="Clear all"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-card border border-border rounded-xl shadow-glass-lg overflow-hidden flex flex-col transition-opacity duration-150 animate-fade-in"
        >
          {searchable && (
            <div className="p-2 border-b border-border bg-input-bg flex items-center gap-2 flex-shrink-0">
              <Search size={16} className="text-text-secondary shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent text-sm outline-none text-text"
                placeholder="Search member name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}

          <div className="px-3 py-2 border-b border-border bg-surface-secondary/30 flex items-center justify-between text-xs text-text-secondary">
            <span>{selectedValues.length} of {options.length} selected</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary font-semibold hover:underline"
            >
              {selectedValues.length === options.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar max-h-[420px]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(String(option.value));
                return (
                  <div
                    key={option.value}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors flex items-center justify-between border-b border-border/20 last:border-b-0 min-h-[40px] ${
                      option.is_child ? 'bg-surface-secondary/20 pl-8' : option.is_head ? 'bg-card font-semibold' : 'bg-card'
                    } ${
                      isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-text'
                    }`}
                    onClick={() => handleToggle(option.value)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.is_child && (
                        <span className="text-text-secondary opacity-60 text-sm select-none shrink-0">↳</span>
                      )}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-sm truncate">{option.label}</span>
                        {option.is_head && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold border border-primary/25 shrink-0">
                            👑 Head {option.child_ids?.length > 0 ? `(${option.child_ids.length})` : ''}
                          </span>
                        )}
                        {option.is_child && option.relation && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-surface-secondary text-text-secondary text-[11px] font-medium border border-border/50 shrink-0 capitalize">
                            {option.relation}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ml-2 shrink-0 ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-border bg-input-bg'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-sm text-text-secondary text-center">
                No members found
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
