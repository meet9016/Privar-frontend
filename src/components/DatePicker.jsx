import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
  name,
  value,
  onChange,
  mode = 'date', // 'date', 'month', 'year'
  className = '',
  placeholder = 'Select date',
  disabled = false,
  error,
  label,
  required,
  maxDate,
  disableFuture = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [viewMode, setViewMode] = useState(mode);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calHeight = 350;
      const width = 270;
      let left = rect.left;
      if (left + width > window.innerWidth - 10) {
        left = Math.max(10, window.innerWidth - width - 10);
      }
      if (spaceBelow < calHeight && rect.top > calHeight) {
        setPopoverStyle({
          position: 'fixed',
          bottom: `${window.innerHeight - rect.top + 4}px`,
          left: `${left}px`,
          width: `${width}px`,
          zIndex: 99999,
        });
      } else {
        setPopoverStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${left}px`,
          width: `${width}px`,
          zIndex: 99999,
        });
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const calHeight = 350;
        const width = 270;
        let left = rect.left;
        if (left + width > window.innerWidth - 10) {
          left = Math.max(10, window.innerWidth - width - 10);
        }
        if (spaceBelow < calHeight && rect.top > calHeight) {
          setPopoverStyle({
            position: 'fixed',
            bottom: `${window.innerHeight - rect.top + 4}px`,
            left: `${left}px`,
            width: `${width}px`,
            zIndex: 99999,
          });
        } else {
          setPopoverStyle({
            position: 'fixed',
            top: `${rect.bottom + 4}px`,
            left: `${left}px`,
            width: `${width}px`,
            zIndex: 99999,
          });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);
  
  // Calculate maximum allowed date only if explicitly requested
  const getMaxAllowedDate = () => {
    if (maxDate) {
      if (maxDate instanceof Date) return maxDate;
      const p = String(maxDate).split('-');
      if (p.length === 3) return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 23, 59, 59, 999);
    }
    if (disableFuture) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return today;
    }
    return null;
  };

  const maxAllowed = getMaxAllowedDate();

  const parseDate = (val) => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    const str = String(val).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    const parts = str.split('-');
    const y = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    const d = parts[2] ? parseInt(parts[2], 10) : 1;
    const parsed = new Date(y, isNaN(m) ? 0 : m, isNaN(d) ? 1 : d);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date();
  };

  // The date that drives the currently viewed month/year in the calendar popover
  const [viewDate, setViewDate] = useState(() => {
    const initial = parseDate(value);
    if (maxAllowed && initial.getTime() > maxAllowed.getTime()) return new Date(maxAllowed);
    return initial;
  });

  const containerRef = useRef(null);

  useEffect(() => {
    setViewMode(mode);
  }, [mode]);

  useEffect(() => {
    if (value) {
      const nextDate = parseDate(value);
      if (!isNaN(nextDate.getTime())) {
        setViewDate(nextDate);
      }
    }
  }, [value]);

  const popoverRef = useRef(null);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatting helpers
  const formatOutput = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (mode === 'year') return `${y}`;
    if (mode === 'month') return `${y}-${m}`;
    return `${y}-${m}-${day}`;
  };

  const getDisplayValue = () => {
    if (!value) return '';
    const d = parseDate(value);
    if (isNaN(d.getTime())) return value;

    if (mode === 'year') return d.getFullYear();
    if (mode === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  // View navigation
  const prev = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const d = new Date(viewDate);
    if (viewMode === 'year') d.setFullYear(d.getFullYear() - 12);
    else if (viewMode === 'month') d.setFullYear(d.getFullYear() - 1);
    else d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const isNextDisabled = () => {
    if (!maxAllowed) return false;
    const d = new Date(viewDate);
    if (viewMode === 'year') {
      const startNextYearGroup = Math.floor(d.getFullYear() / 12) * 12 + 12;
      return new Date(startNextYearGroup, 0, 1, 0, 0, 0, 0).getTime() > maxAllowed.getTime();
    } else if (viewMode === 'month') {
      const nextYear = d.getFullYear() + 1;
      return new Date(nextYear, 0, 1, 0, 0, 0, 0).getTime() > maxAllowed.getTime();
    } else {
      const nextMonthStart = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
      return nextMonthStart.getTime() > maxAllowed.getTime();
    }
  };

  const next = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isNextDisabled()) return;
    const d = new Date(viewDate);
    if (viewMode === 'year') d.setFullYear(d.getFullYear() + 12);
    else if (viewMode === 'month') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  // Selections
  const handleSelectYear = (y) => {
    const d = new Date(viewDate);
    d.setFullYear(y);
    setViewDate(d);
    if (mode === 'year') {
      if (onChange) onChange(formatOutput(d));
      setIsOpen(false);
    } else {
      setViewMode('month');
    }
  };

  const handleSelectMonth = (mIndex) => {
    const d = new Date(viewDate);
    d.setMonth(mIndex);
    setViewDate(d);
    if (mode === 'month') {
      if (onChange) onChange(formatOutput(d));
      setIsOpen(false);
    } else {
      setViewMode('date');
    }
  };

  const handleSelectDate = (d, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const formatted = formatOutput(d);
    if (onChange) onChange(formatted);
    setIsOpen(false);
  };

  // Render Builders
  const renderYears = () => {
    const startYear = Math.floor(viewDate.getFullYear() / 12) * 12;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);
    
    // currently selected year logic
    let selectedYear = null;
    if (value) selectedYear = parseInt(value.split('-')[0], 10);

    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {years.map(y => {
          const isSelected = y === selectedYear;
          const startOfYear = new Date(y, 0, 1, 0, 0, 0, 0);
          const isDisabled = maxAllowed && startOfYear.getTime() > maxAllowed.getTime();

          return (
            <button
              key={y}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && handleSelectYear(y)}
              className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed text-text-secondary line-through pointer-events-none'
                  : isSelected 
                    ? 'bg-primary text-white font-semibold' 
                    : 'hover:bg-primary/10 text-text'
              }`}
            >
              {y}
            </button>
          )
        })}
      </div>
    );
  };

  const renderMonths = () => {
    let selectedMonth = null, selectedYear = null;
    if (value) {
      const p = value.split('-');
      selectedYear = parseInt(p[0], 10);
      selectedMonth = p[1] ? parseInt(p[1], 10) - 1 : null;
    }

    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {MONTHS.map((m, i) => {
          const isSelected = i === selectedMonth && viewDate.getFullYear() === selectedYear;
          const startOfMonth = new Date(viewDate.getFullYear(), i, 1, 0, 0, 0, 0);
          const isDisabled = maxAllowed && startOfMonth.getTime() > maxAllowed.getTime();

          return (
            <button
              key={m}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && handleSelectMonth(i)}
              className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed text-text-secondary line-through pointer-events-none'
                  : isSelected 
                    ? 'bg-primary text-white font-semibold' 
                    : 'hover:bg-primary/10 text-text'
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>
    );
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const selectedDateObj = value ? parseDate(value) : null;

    return (
      <div className="p-2">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-text-secondary py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-1">
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="w-8 h-8" />;
            const isSelected = selectedDateObj &&
              d.getFullYear() === selectedDateObj.getFullYear() &&
              d.getMonth() === selectedDateObj.getMonth() &&
              d.getDate() === selectedDateObj.getDate();
            const isToday = new Date().toDateString() === d.toDateString();
            const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
            const isDisabled = maxAllowed && dStart.getTime() > maxAllowed.getTime();
            
            let btnClass = 'w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors ';
            if (isDisabled) {
              btnClass += 'opacity-30 cursor-not-allowed text-text-secondary line-through pointer-events-none ';
            } else if (isSelected) {
              btnClass += 'bg-primary text-white font-semibold shadow-md ';
            } else if (isToday) {
              btnClass += 'bg-primary/10 text-primary font-semibold hover:bg-primary/20 ';
            } else {
              btnClass += 'text-text hover:bg-surface-secondary ';
            }

            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={(e) => !isDisabled && handleSelectDate(d, e)}
                className={btnClass}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {/* Trigger Input */}
      <div
        onClick={toggleOpen}
        className={`relative cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="text"
          readOnly
          value={getDisplayValue()}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-input-bg text-text border ${
            error ? 'border-red-500' : 'border-border focus:border-primary/50'
          } rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer pr-10 ${className}`}
          disabled={disabled}
        />
        <CalendarIcon className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Popover */}
      {isOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={popoverRef}
          style={popoverStyle}
          className="bg-surface border border-border rounded-xl shadow-glass overflow-hidden text-text"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-surface-secondary/50">
            <button type="button" onClick={prev} className="p-1.5 hover:bg-surface rounded-lg text-text-secondary hover:text-text transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                if (viewMode === 'date') setViewMode('month');
                else if (viewMode === 'month') setViewMode('year');
              }}
              className="text-sm font-semibold hover:bg-surface px-2 py-1 rounded-lg transition-colors"
            >
              {viewMode === 'year' && (
                `${Math.floor(viewDate.getFullYear() / 12) * 12} - ${Math.floor(viewDate.getFullYear() / 12) * 12 + 11}`
              )}
              {viewMode === 'month' && viewDate.getFullYear()}
              {viewMode === 'date' && `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
            </button>
            
            <button 
              type="button" 
              onClick={next} 
              disabled={isNextDisabled()} 
              className={`p-1.5 rounded-lg transition-colors ${
                isNextDisabled() 
                  ? 'opacity-30 cursor-not-allowed text-text-secondary pointer-events-none' 
                  : 'hover:bg-surface text-text-secondary hover:text-text'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {viewMode === 'year' && renderYears()}
          {viewMode === 'month' && renderMonths()}
          {viewMode === 'date' && renderDays()}
          
          {/* Clear Button */}
          {value && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="w-full py-1.5 text-sm text-error-text hover:bg-error-bg rounded-lg transition-colors font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}
