import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  wrapperClassName = 'relative flex-1 sm:w-64',
  autoFocus = false,
  disabled = false
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const hasValue = Boolean(value && String(value).length > 0);

  return (
    <div className={`relative ${wrapperClassName.replace('relative', '').trim()}`}>
      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
        <Search className="w-4 h-4" />
      </span>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={`w-full h-10 bg-input-bg text-text placeholder-text-secondary/50 border border-primary focus:border-primary-dark rounded-xl pl-10 ${hasValue ? 'pr-9' : 'pr-4'} text-sm outline-none focus:ring-4 focus:ring-primary/20 transition-all ${className}`}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary/60 hover:text-text cursor-pointer transition-colors"
          title="Clear search"
        >
          <div className="w-4 h-4 rounded-full bg-surface-secondary border border-border flex items-center justify-center hover:bg-border/60 transition-colors">
            <X className="w-2.5 h-2.5" />
          </div>
        </button>
      )}
    </div>
  );
}
