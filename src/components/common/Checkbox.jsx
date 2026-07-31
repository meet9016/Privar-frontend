import React from 'react';
import { Check } from 'lucide-react';

/**
 * Styled Checkbox component with a premium vest-style look.
 * Props:
 *  - checked: boolean
 *  - onChange: function(boolean)
 *  - label: string | ReactNode
 *  - indeterminate: boolean (shows a dash "-" for "select all" state)
 *  - disabled: boolean
 *  - className: string
 */
export default function Checkbox({
  checked = false,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  className = ''
}) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 flex-shrink-0
          ${
            checked || indeterminate
              ? 'bg-primary border-primary shadow-md shadow-primary/30'
              : 'bg-input-bg border-border group-hover:border-primary/50'
          }
        `}
      >
        {indeterminate ? (
          <span className="w-2.5 h-0.5 rounded-full bg-white block" />
        ) : checked ? (
          <Check className="w-3 h-3 text-white stroke-[3]" />
        ) : null}
      </span>
      {label && (
        <span className="text-sm font-medium text-text leading-tight">{label}</span>
      )}
    </label>
  );
}
