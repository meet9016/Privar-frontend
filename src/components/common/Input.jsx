import React from 'react';

export default function Input({ 
  label, 
  error, 
  required, 
  className = '',
  icon,
  ...props 
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {props.type === 'textarea' ? (
        <textarea
          {...props}
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
        />
      ) : icon ? (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-secondary">
            {icon}
          </span>
          <input
            {...props}
            className={`w-full pl-10 pr-3 py-2 bg-input-bg text-text border ${
              error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
            } rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
          />
        </div>
      ) : (
        <input
          {...props}
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
        />
      )}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
