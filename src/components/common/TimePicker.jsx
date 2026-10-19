import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, X, ChevronDown } from 'lucide-react'

// Convert Gujarati digits (૦-૯) to standard ASCII digits (0-9)
const normalizeDigits = (str = '') => {
  return String(str).replace(/[૦-૯]/g, (d) => '૦૧૨૩૪૫૬૭૮૯'.indexOf(d))
}

// Parse any time string (e.g. "1.30 pm", "10:00 AM", "13:30", "5:30", "01:30 PM") into { hours, minutes, period, formatted }
export const parseTimeString = (str) => {
  if (!str) return null
  let s = normalizeDigits(String(str).trim())

  // Detect AM or PM
  let period = null
  if (/am/i.test(s)) period = 'AM'
  else if (/pm/i.test(s)) period = 'PM'

  // Extract numeric and separator parts
  const clean = s.replace(/[^\d:.]/g, '')
  if (!clean) return null

  let hours = 12
  let minutes = 0

  if (clean.includes(':') || clean.includes('.')) {
    const sep = clean.includes(':') ? ':' : '.'
    const parts = clean.split(sep)
    hours = parseInt(parts[0], 10) || 0
    minutes = parseInt(parts[1], 10) || 0
  } else if (clean.length === 3) {
    // e.g. 130 -> 1:30
    hours = parseInt(clean.slice(0, 1), 10) || 0
    minutes = parseInt(clean.slice(1), 10) || 0
  } else if (clean.length === 4) {
    // e.g. 1030 -> 10:30
    hours = parseInt(clean.slice(0, 2), 10) || 0
    minutes = parseInt(clean.slice(2), 10) || 0
  } else {
    hours = parseInt(clean, 10) || 0
    minutes = 0
  }

  // Handle 24-hour vs 12-hour period inference
  if (!period) {
    if (hours >= 12) {
      period = 'PM'
      if (hours > 12) hours = hours - 12
    } else {
      period = 'AM'
      if (hours === 0) hours = 12
    }
  } else {
    if (hours > 12) hours = hours % 12
    if (hours === 0) hours = 12
  }

  hours = Math.min(12, Math.max(1, hours))
  minutes = Math.min(59, Math.max(0, minutes))

  const hStr = String(hours).padStart(2, '0')
  const mStr = String(minutes).padStart(2, '0')

  return {
    hours: hStr,
    minutes: mStr,
    period,
    formatted: `${hStr}:${mStr} ${period}`
  }
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const COMMON_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export default function TimePicker({
  label,
  value = '',
  onChange,
  error,
  required,
  placeholder = 'Select time (e.g. 10:00 AM)',
  disabled = false,
  className = '',
  name
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState({})
  const [inputValue, setInputValue] = useState(value || '')

  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  // Keep internal input text in sync with external value
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Parse current value for picker state
  const parsed = parseTimeString(value)
  const currentHours = parsed?.hours || '10'
  const currentMinutes = parsed?.minutes || '00'
  const currentPeriod = parsed?.period || 'AM'

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    const popoverWidth = 290
    const popoverHeight = 270
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    let left = rect.left
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12)
    }

    const isDropUp = spaceBelow < popoverHeight && spaceAbove > spaceBelow

    if (isDropUp) {
      setPopoverStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 6}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 999999
      })
    } else {
      setPopoverStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 999999
      })
    }
  }

  useEffect(() => {
    if (!isOpen) return

    updatePosition()
    const handleScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const toggleOpen = () => {
    if (disabled) return
    if (!isOpen) updatePosition()
    setIsOpen(!isOpen)
  }

  const applyTime = (h, m, p) => {
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`
    setInputValue(formatted)
    onChange?.(formatted)
  }

  const handleSelectHour = (h) => {
    applyTime(h, currentMinutes, currentPeriod)
  }

  const handleSelectMinute = (m) => {
    applyTime(currentHours, m, currentPeriod)
  }

  const handleSelectPeriod = (p) => {
    applyTime(currentHours, currentMinutes, p)
  }

  const handleClear = (e) => {
    e?.stopPropagation()
    setInputValue('')
    onChange?.('')
  }

  // Keydown filter: strictly block ANY character that is not a digit, colon, period, space, or a/p/m
  const handleKeyDown = (e) => {
    // Allow control keys
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'Escape' ||
      e.key.startsWith('Arrow') ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      if (e.key === 'Enter') {
        const parsedResult = parseTimeString(e.target.value)
        if (parsedResult) {
          setInputValue(parsedResult.formatted)
          onChange?.(parsedResult.formatted)
        }
        setIsOpen(false)
      }
      return
    }

    // Allow only digits, colon, dot, space, and a/p/m
    if (!/^[0-9:. apmAPM]$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handleInputChange = (e) => {
    // Strip any illegal characters
    const sanitized = normalizeDigits(e.target.value).replace(/[^0-9:. apmAPM]/gi, '')
    setInputValue(sanitized)
    onChange?.(sanitized)
  }

  const handleBlur = () => {
    if (!inputValue.trim()) {
      onChange?.('')
      return
    }
    const parsedResult = parseTimeString(inputValue)
    if (parsedResult) {
      setInputValue(parsedResult.formatted)
      onChange?.(parsedResult.formatted)
    } else {
      // Revert if invalid
      setInputValue(value || '')
    }
  }

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value || ''} />}

      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Field with Clock Icon and Actions */}
      <div
        ref={triggerRef}
        className={`relative flex items-center bg-input-bg text-text border ${
          error ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15'
        } rounded-xl text-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          onClick={toggleOpen}
          className="pl-3.5 pr-2 py-2.5 text-text-secondary flex items-center cursor-pointer hover:text-primary transition-colors focus:outline-none"
          title="Open time picker"
        >
          <Clock className="w-4 h-4" />
        </span>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={() => !isOpen && toggleOpen()}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full py-2.5 bg-transparent text-text text-sm outline-none font-medium placeholder:text-text-secondary/50 focus:outline-none focus:ring-0"
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-text-secondary hover:text-text rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-0"
            title="Clear time"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle Dropdown Chevron */}
        <button
          type="button"
          onClick={toggleOpen}
          disabled={disabled}
          className="pr-3 pl-1 py-2.5 text-text-secondary hover:text-text cursor-pointer transition-transform duration-200 focus:outline-none focus:ring-0"
          title="Toggle time picker"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}

      {/* Time Picker Popover */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="bg-card border border-border rounded-2xl shadow-glass-lg p-3 flex flex-col gap-2.5 text-text animate-fade-in backdrop-blur-md select-none"
          >
            {/* Header: Selected Time Display & AM/PM Switcher */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Time:</span>
                <span className="text-sm font-black text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                  {currentHours}:{currentMinutes} {currentPeriod}
                </span>
              </div>

              {/* AM / PM Segmented Control */}
              <div className="inline-flex rounded-xl p-0.5 bg-surface-secondary border border-border">
                <button
                  type="button"
                  onClick={() => handleSelectPeriod('AM')}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-0 ${
                    currentPeriod === 'AM'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPeriod('PM')}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-0 ${
                    currentPeriod === 'PM'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Hours & Minutes Selector Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Hours Column */}
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Hour
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {HOURS.map((h) => {
                    const isSelected = h === currentHours
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleSelectHour(h)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-0 ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-input-bg text-text hover:bg-primary/10 border border-border/50 hover:border-primary/30'
                        }`}
                      >
                        {h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Minutes Column */}
              <div>
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Minute
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {COMMON_MINUTES.map((m) => {
                    const isSelected = m === currentMinutes
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMinute(m)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-0 ${
                          isSelected
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-input-bg text-text hover:bg-primary/10 border border-border/50 hover:border-primary/30'
                        }`}
                      >
                        :{m}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer with Clear & Done Button */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-text-secondary hover:text-red-500 cursor-pointer transition-colors focus:outline-none focus:ring-0"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-0"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
