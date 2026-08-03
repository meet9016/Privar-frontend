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
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`w-full px-3 py-2 bg-input-bg text-text border ${
          error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
        } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <span className={selectedOption ? 'text-text' : 'text-text-secondary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-glass-lg overflow-hidden">
          {searchable && (
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
                    value === option.value ? 'bg-primary/5 text-primary font-medium' : 'text-text'
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

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
