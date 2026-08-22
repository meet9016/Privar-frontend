import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ 
  label, 
  error, 
  required, 
  className = '',
  icon,
  type = 'text',
  onChange,
  value,
  onlyNumbers,
  maxLength,
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isTel = type === 'tel' || onlyNumbers || (type !== 'email' && label && /contact|phone|mobile|number/i.test(label) && !/email|account_number|gst|serial|code/i.test(label));
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (isTel ? 'tel' : type);
  const maxLen = maxLength || (isTel ? 10 : undefined);

  const handleKeyDown = (e) => {
    if (props.onKeyDown) props.onKeyDown(e);
    if (isTel) {
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter' ||
        e.key.startsWith('Arrow') ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.ctrlKey ||
        e.metaKey
      ) {
        return;
      }
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    }
  };

  const handleChange = (e) => {
    if (isTel) {
      const sanitized = e.target.value.replace(/\D/g, '').slice(0, maxLen);
      e.target.value = sanitized;
    }
    if (onChange) onChange(e);
  };

  const defaultPlaceholder = label ? `Enter ${label}` : undefined;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          placeholder={defaultPlaceholder}
          {...props}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all`}
        />
      ) : (
        <div className="relative">
          {icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
              {icon}
            </span>
          )}
          <input
            placeholder={defaultPlaceholder}
            {...props}
            type={inputType}
            value={value}
            maxLength={maxLen}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            className={`w-full ${icon ? 'pl-10' : 'px-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2 bg-input-bg text-text border ${
              error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
            } rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}

