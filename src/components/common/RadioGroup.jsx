import React from 'react';

export default function RadioGroup({
  label,
  options = [],
  value,
  onChange,
  name,
  error,
  required,
  orientation = 'horizontal',
  className = ''
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className={`flex gap-4 ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
        {options.map((option, idx) => (
          <label 
            key={idx} 
            className={`flex items-center gap-2 cursor-pointer py-1 transition-all ${
              value === option.value 
                ? 'text-primary' 
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-primary bg-input-bg border-border focus:ring-primary/50 cursor-pointer accent-primary"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}
