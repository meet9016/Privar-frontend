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
  placement = 'auto'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

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
  }, [isOpen, placement]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchTerm('');
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = options.filter(option => 
    String(option.label || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (val) => { 
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
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
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
          }`}
          onClick={toggleOpen}
          tabIndex={disabled ? -1 : 0}
        >
          <span className={selectedOption ? 'text-text font-medium truncate' : 'text-text-secondary truncate'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div 
                  key={option.value}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors ${
                    String(value) === String(option.value) ? 'bg-primary/5 text-primary font-semibold' : 'text-text'
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-text-secondary text-center">
                No options found
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
  