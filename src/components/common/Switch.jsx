import React from 'react'

export default function Switch({
  label,
  checked = false,
  onChange,
  disabled = false,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  showText = true,
  className = '',
  name
}) {
  const isChecked = Boolean(checked)

  return (
    <div className={`flex flex-col justify-center ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2.5 h-[38px]">
        <label className={`relative inline-flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            name={name}
            className="sr-only peer"
            checked={isChecked}
            onChange={(e) => onChange && onChange(e.target.checked)}
            disabled={disabled}
          />
          <div className="w-11 h-6 bg-gray-300 dark:bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
        {showText && (
          <span className="text-xs font-semibold text-text select-none">
            {isChecked ? activeLabel : inactiveLabel}
          </span>
        )}
      </div>
    </div>
  )
}
