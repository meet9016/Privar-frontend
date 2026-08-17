import React, { useState, useRef, useEffect } from 'react';
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
  const [dropUp, setDropUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && wrapperRef.current) {
      if (placement === 'down') {
        setDropUp(false);
      } else if (placement === 'up') {
        setDropUp(true);
      } else {
        const rect = wrapperRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // For small lists (e.g. Status with 2-3 options), only dropUp if spaceBelow is under 80px
        const threshold = options.length <= 4 ? 80 : 120;
        setDropUp(spaceBelow < threshold);
      }
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

  const showSearch = searchable && options.length > 5;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative w-full">
        <div 
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
          }`}
          onClick={toggleOpen}
          tabIndex={disabled ? -1 : 0}
        >
          <span className={selectedOption ? 'text-text font-medium' : 'text-text-secondary'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className={`absolute z-[9999] w-full ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'} bg-card border border-border rounded-xl shadow-glass-lg overflow-hidden`}>
            {showSearch && (
              <div className="p-2 border-b border-border bg-input-bg flex items-center gap-2">
                <Search size={16} className="text-text-secondary" />
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
            
            <div className="max-h-60 overflow-y-auto">
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
                <div className="px-3 py-2 text-sm text-text-secondary text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
