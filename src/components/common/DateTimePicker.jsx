import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function DateTimePicker({
  label,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select date & time',
  disabled = false,
  min,
  max,
  className = '',
  placement = 'auto'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState({})
  const containerRef = useRef(null)
  const popoverRef = useRef(null)

  // Parse current value
  const parsedDate = value ? new Date(value) : null
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime())

  // View state for calendar navigation
  const [viewDate, setViewDate] = useState(isValidDate ? parsedDate : new Date())
  const [selectedHours, setSelectedHours] = useState(isValidDate ? parsedDate.getHours() : 12)
  const [selectedMinutes, setSelectedMinutes] = useState(isValidDate ? parsedDate.getMinutes() : 0)

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewDate(d)
        setSelectedHours(d.getHours())
        setSelectedMinutes(d.getMinutes())
      }
    }
  }, [value])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return
    const update = () => setPopoverStyle(calcPopoverStyle())
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const calcPopoverStyle = () => {
    if (!containerRef.current) return {}
    const rect = containerRef.current.getBoundingClientRect()
    const popoverWidth = 370
    const popoverHeight = 340
    const spaceBelow = window.innerHeight - rect.bottom
    let left = rect.left
    if (left + popoverWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popoverWidth - 10)
    }
    if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
      return { position: 'fixed', bottom: `${window.innerHeight - rect.top + 4}px`, left: `${left}px`, width: `${popoverWidth}px`, zIndex: 99999 }
    }
    return { position: 'fixed', top: `${rect.bottom + 4}px`, left: `${left}px`, width: `${popoverWidth}px`, zIndex: 99999 }
  }

  const toggleOpen = () => {
    if (disabled) return
    if (!isOpen) {
      setPopoverStyle(calcPopoverStyle())
      if (isValidDate) {
        setViewDate(parsedDate)
        setSelectedHours(parsedDate.getHours())
        setSelectedMinutes(parsedDate.getMinutes())
      } else {
        setViewDate(new Date())
      }
    }
    setIsOpen(!isOpen)
  }

  const formatDisplay = () => {
    if (!isValidDate) return ''
    const d = parsedDate.getDate().toString().padStart(2, '0')
    const m = (parsedDate.getMonth() + 1).toString().padStart(2, '0')
    const y = parsedDate.getFullYear()
    const hh = parsedDate.getHours().toString().padStart(2, '0')
    const mm = parsedDate.getMinutes().toString().padStart(2, '0')
    return `${d}-${m}-${y} ${hh}:${mm}`
  }

  const emitDateTime = (targetDate, hours, minutes) => {
    const d = new Date(targetDate)
    d.setHours(hours)
    d.setMinutes(minutes)
    d.setSeconds(0)
    d.setMilliseconds(0)

    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')

    const formattedIso = `${year}-${month}-${day}T${hh}:${mm}`
    onChange({ target: { value: formattedIso } })
  }

  const handleSelectDay = (day) => {
    const newTarget = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    emitDateTime(newTarget, selectedHours, selectedMinutes)
  }

  const handleHourChange = (newHour) => {
    setSelectedHours(newHour)
    const baseDate = isValidDate ? parsedDate : viewDate
    emitDateTime(baseDate, newHour, selectedMinutes)
  }

  const handleMinuteChange = (newMinute) => {
    setSelectedMinutes(newMinute)
    const baseDate = isValidDate ? parsedDate : viewDate
    emitDateTime(baseDate, selectedHours, newMinute)
  }

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleSetToday = (e) => {
    e.stopPropagation()
    const now = new Date()
    setViewDate(now)
    setSelectedHours(now.getHours())
    setSelectedMinutes(now.getMinutes())
    emitDateTime(now, now.getHours(), now.getMinutes())
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ target: { value: '' } })
    setIsOpen(false)
  }

  // Calendar math
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input box */}
      <div
        onClick={toggleOpen}
        tabIndex={disabled ? -1 : 0}
        className={`w-full px-3.5 py-2.5 bg-input-bg text-text border ${
          error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary/50'
        } rounded-xl text-sm outline-none transition-all flex items-center justify-between cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-primary/10'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <span className={isValidDate ? 'text-text font-medium' : 'text-text-secondary/60'}>
            {isValidDate ? formatDisplay() : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-text-secondary">
          {isValidDate && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-red-500 rounded-md transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Clock className="w-3.5 h-3.5 opacity-60" />
        </div>
      </div>

      {/* Custom Theme Dropdown Picker — rendered via portal so it's never clipped by modal overflow */}
      {isOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-surface border border-border rounded-2xl shadow-glass-xl overflow-hidden p-4 animate-scale-in text-text"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4">
            {/* Left: Date Picker */}
            <div className="flex-1">
              {/* Month Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <span className="text-sm font-bold text-text">
                  {monthNames[month]}, {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekDays.map((wd) => (
                  <span key={wd} className="text-[11px] font-semibold text-text-secondary">
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <span key={`empty-${i}`} className="w-7 h-7" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const isSelected =
                    isValidDate &&
                    parsedDate.getDate() === dayNum &&
                    parsedDate.getMonth() === month &&
                    parsedDate.getFullYear() === year

                  const isToday =
                    new Date().getDate() === dayNum &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`w-7 h-7 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-glow-primary'
                          : isToday
                          ? 'border border-primary text-primary hover:bg-primary/10'
                          : 'text-text hover:bg-surface-secondary'
                      }`}
                    >
                      {dayNum}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Time Selector */}
            <div className="w-32 pl-4 border-l border-border flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-1.5 pb-1.5 border-b border-border">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Time
                </div>

                {/* Hours & Minutes Dual Counter Cards */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  {/* Hours Block */}
                  <div className="flex flex-col items-center bg-input-bg border border-border/80 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold uppercase text-text-secondary/70 mb-1">Hour</span>
                    <button
                      type="button"
                      onClick={() => handleHourChange((selectedHours + 1) % 24)}
                      className="w-full py-1 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <span className="my-1.5 text-sm font-bold text-primary font-mono">
                      {selectedHours.toString().padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleHourChange((selectedHours - 1 + 24) % 24)}
                      className="w-full py-1 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>

                  {/* Minutes Block */}
                  <div className="flex flex-col items-center bg-input-bg border border-border/80 rounded-xl p-1.5">
                    <span className="text-[10px] font-bold uppercase text-text-secondary/70 mb-1">Min</span>
                    <button
                      type="button"
                      onClick={() => handleMinuteChange((selectedMinutes + 5) % 60)}
                      className="w-full py-1 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <span className="my-1.5 text-sm font-bold text-primary font-mono">
                      {selectedMinutes.toString().padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMinuteChange((selectedMinutes - 5 + 60) % 60)}
                      className="w-full py-1 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AM/PM indicator badge */}
              <div className="mt-3 text-center">
                <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
                  {selectedHours >= 12 ? 'PM' : 'AM'} ({selectedHours % 12 || 12}:{selectedMinutes.toString().padStart(2, '0')})
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-glow-primary transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  )
}
