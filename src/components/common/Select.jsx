import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  required,
  placeholder = 'Select an option',
  searchable = true,
  disabled = false,
  className = '',
  name,
  placement = 'auto',
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onSearchChange,
  loading = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const isLoadingMoreRef = useRef(isLoadingMore);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuMaxHeight = 240;

    let isDropUp = false;
    if (placement === 'up') {
      isDropUp = true;
    } else if (placement === 'down') {
      isDropUp = false;
    } else {
      isDropUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    }

    const availableHeight = isDropUp ? spaceAbove - 16 : spaceBelow - 16;
    const calculatedMaxHeight = Math.max(120, Math.min(menuMaxHeight + 50, availableHeight));

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

    const handleScrollOrResize = () => {
      updatePosition();
    };

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
        if (searchTerm) {
          setSearchTerm('');
          if (onSearchChange) {
            onSearchChange('');
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, placement, onSearchChange]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    } else {
      if (searchTerm) {
        setSearchTerm('');
        if (onSearchChange) {
          onSearchChange('');
        }
      }
    }
    setIsOpen(!isOpen);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleListScroll = (e) => {
    if (!onLoadMore || isLoadingMore || isLoadingMoreRef.current || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop > 0 && scrollHeight - scrollTop - clientHeight <= 60) {
      isLoadingMoreRef.current = true;
      onLoadMore();
    }
  };

  const filteredOptions = onSearchChange
    ? (searchTerm.trim()
      ? options.filter(option => {
        if (option.value === '') return false;
        const term = searchTerm.toLowerCase();
        return (
          String(option.label || '').toLowerCase().includes(term) ||
          String(option.sublabel || '').toLowerCase().includes(term) ||
          String(option.searchKey || '').toLowerCase().includes(term)
        );
      })
      : options
    )
    : options.filter(option =>
      String(option.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(option.sublabel || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const hasSelectedValue = selectedOption && selectedOption.value !== '' && selectedOption.value !== undefined && selectedOption.value !== null;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    if (searchTerm) {
      setSearchTerm('');
      if (onSearchChange) {
        onSearchChange('');
      }
    }
  };

  const showSearch = searchable;

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative w-full" ref={triggerRef}>
        <div
          className={`w-full px-3 py-2 bg-input-bg text-text border ${error ? 'border-red-500' : 'border-border focus:border-primary/50'
            } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
            }`}
          onClick={toggleOpen}
          tabIndex={disabled ? -1 : 0}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasSelectedValue && selectedOption?.image && (
              <img src={selectedOption.image} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-border" />
            )}
            <span className={hasSelectedValue ? 'text-text font-medium truncate' : 'text-text-secondary truncate'}>
              {hasSelectedValue ? selectedOption.label : (placeholder || selectedOption?.label || 'Select an option')}
            </span>
          </div>
          <ChevronDown size={16} className={`text-text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-card border border-border rounded-xl shadow-glass-lg overflow-hidden flex flex-col transition-opacity duration-150 animate-fade-in"
        >
          {showSearch && (
            <div className="p-2 border-b border-border bg-input-bg flex items-center gap-2 flex-shrink-0">
              <Search size={16} className="text-text-secondary shrink-0" />
              <input
                type="text"
                className="w-full bg-transparent text-sm outline-none text-text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </div>
          )}

          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="overflow-y-auto flex-1 custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <div
                  key={`${option.value}-${idx}`}
                  title={option.description || option.title || option.meaning || ''}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2.5 ${String(value) === String(option.value) ? 'bg-primary/5 text-primary font-semibold' : 'text-text'
                    }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.image ? (
                    <img src={option.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-border" />
                  ) : option.imagePlaceholder ? (
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                      {option.imagePlaceholder}
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{option.label}</span>
                    </div>
                    {(option.sublabel || option.description || option.meaning) && (
                      <div className="text-[11px] text-text-secondary/80 font-normal truncate mt-0.5">
                        {option.sublabel || option.description || option.meaning}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-text-secondary text-center">
                {loading ? 'Searching members...' : 'No options found'}
              </div>
            )}

            {isLoadingMore && (
              <div className="py-2.5 px-3 text-center text-xs text-text-secondary flex items-center justify-center gap-2 border-t border-border/40 bg-surface-secondary/20">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Loading more members...</span>
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
