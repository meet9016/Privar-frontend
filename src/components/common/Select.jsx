import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Plus } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  onCreateOption,
  creatable = false,
  createPrompt = 'Add',
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
        width: `${Math.max(rect.width, 240)}px`,
        minWidth: `${Math.max(rect.width, 240)}px`,
        maxHeight: `${calculatedMaxHeight}px`,
        zIndex: 999999,
      });
    } else {
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 240)}px`,
        minWidth: `${Math.max(rect.width, 240)}px`,
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

  const trimmedSearch = searchTerm.trim();
  const exactMatchExists = options.some(
    opt => String(opt.value).toLowerCase() === trimmedSearch.toLowerCase() ||
           String(opt.label).toLowerCase() === trimmedSearch.toLowerCase()
  );
  const showCreateOption = creatable && trimmedSearch.length > 0 && !exactMatchExists;

  const handleCreateOption = (e) => {
    e?.stopPropagation();
    if (!trimmedSearch) return;
    if (onCreateOption) {
      onCreateOption(trimmedSearch);
    } else {
      onChange(trimmedSearch);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const [newOptionInput, setNewOptionInput] = useState('');

  const trimmedInput = newOptionInput.trim();

  const handleAddNewItem = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!trimmedInput) return;
    if (onCreateOption) {
      onCreateOption(trimmedInput);
    } else {
      onChange(trimmedInput);
    }
    setNewOptionInput('');
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
          <div className="flex items-center gap-2 min-w-0">
            {selectedOption?.image && (
              <img src={selectedOption.image} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-border" />
            )}
            <span className={selectedOption || value ? 'text-text font-medium truncate' : 'text-text-secondary truncate'}>
              {selectedOption ? selectedOption.label : (value || placeholder)}
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
            <div className="p-2 border-b border-border bg-surface-secondary/40 flex items-center gap-2 flex-shrink-0">
              <Search size={15} className="text-text-secondary shrink-0" />
              <input 
                type="text"
                className="w-full bg-transparent text-sm outline-none text-text placeholder:text-text-secondary/60"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          
          <div className="overflow-y-auto flex-1 custom-scrollbar max-h-48 divide-y divide-border/20">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div 
                  key={option.value}
                  title={option.description || option.title || option.meaning || ''}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2.5 ${
                    String(value) === String(option.value) ? 'bg-primary/10 text-primary font-semibold' : 'text-text'
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
            ) : showCreateOption ? (
              <div 
                className="px-3 py-2.5 text-sm cursor-pointer bg-primary/5 hover:bg-primary/15 text-primary transition-colors flex items-center gap-2 font-medium"
                onClick={handleCreateOption}
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Plus size={14} />
                </div>
                <div className="truncate">
                  {createPrompt} <span className="font-bold">"{trimmedSearch}"</span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 text-sm text-text-secondary text-center">
                No options found
              </div>
            )}

            {filteredOptions.length > 0 && showCreateOption && (
              <div 
                className="px-3 py-2 text-sm cursor-pointer bg-primary/5 hover:bg-primary/15 text-primary transition-colors flex items-center gap-2 font-medium border-t border-dashed border-primary/20"
                onClick={handleCreateOption}
              >
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Plus size={12} />
                </div>
                <div className="truncate text-xs">
                  {createPrompt} <span className="font-bold">"{trimmedSearch}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Custom Add Bar with Theme Colors & Responsive Layout */}
          {creatable && (
            <div 
              className="p-2 border-t border-border bg-surface-secondary/70 flex items-center gap-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <Plus size={15} />
              </div>
              <input
                type="text"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewItem(e);
                  }
                }}
                placeholder={`Add new ${label ? label.toLowerCase() : 'item'}...`}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-input-bg text-text border border-border rounded-lg text-xs outline-none focus:border-primary/60 placeholder:text-text-secondary/60 transition-all"
              />
              <button
                type="button"
                onClick={handleAddNewItem}
                disabled={!trimmedInput}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer shrink-0"
              >
                Add
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
  