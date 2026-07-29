import React, { useMemo } from 'react'

/**
 * Reusable year select dropdown component.
 *
 * Props:
 *  - value        : currently selected year (string)
 *  - onChange      : callback receiving the new year string
 *  - name         : optional form field name (defaults to "year")
 *  - placeholder  : placeholder text (defaults to "Select Year")
 *  - className    : CSS class string for the <select>
 *  - disabled     : disable the select
 *  - required     : mark as required
 *  - startYear    : earliest year to show (defaults to 2000)
 *  - endYear      : latest year to show  (defaults to current year + 1)
 *  - defaultValue : uncontrolled default value (if value is not provided)
 */

export default function YearSelect({
  value,
  onChange,
  name = 'year',
  placeholder = 'Select Year',
  className = '',
  disabled = false,
  required = false,
  startYear = 2000,
  endYear,
  defaultValue,
}) {
  const years = useMemo(() => {
    const end = endYear || new Date().getFullYear() + 1
    const list = []
    for (let y = end; y >= startYear; y--) {
      list.push(String(y))
    }
    return list
  }, [startYear, endYear])

  const isControlled = value !== undefined

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return (
    <select
      name={name}
      {...(isControlled ? { value } : { defaultValue: defaultValue || '' })}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      required={required}
    >
      <option value="" className="bg-surface text-text">
        {placeholder}
      </option>
      {years.map((y) => (
        <option key={y} value={y} className="bg-surface text-text">
          {y}
        </option>
      ))}
    </select>
  )
}
