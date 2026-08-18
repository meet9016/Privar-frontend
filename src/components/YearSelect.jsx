import React, { useMemo } from 'react'
import Select from './common/Select'

/**
 * Reusable year select dropdown component using custom Select design.
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
  error,
  label
}) {
  const years = useMemo(() => {
    const end = endYear || new Date().getFullYear() + 1
    const list = []
    for (let y = end; y >= startYear; y--) {
      list.push(String(y))
    }
    return list
  }, [startYear, endYear])

  const options = useMemo(() => {
    return years.map((y) => ({ label: y, value: y }))
  }, [years])

  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue)
    }
  }, [defaultValue])

  const currentValue = value !== undefined ? value : internalValue

  return (
    <Select
      name={name}
      label={label}
      value={currentValue}
      onChange={(val) => {
        setInternalValue(val)
        if (onChange) onChange(val)
      }}
      options={options}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
      error={error}
      searchable={true}
    />
  )
}

