import React, { useState, useEffect, useRef } from 'react';
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // The date that drives the currently viewed month/year in the calendar popover
  const [viewDate, setViewDate] = useState(() => {
    if (!value) return new Date();
    const parts = value.split('-');
    const y = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    const d = parts[2] ? parseInt(parts[2], 10) : 1;
    return new Date(y, m, d);
  });

  // What level are we selecting? (day grid, month grid, year grid)
  const [viewMode, setViewMode] = useState(mode);
  const containerRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // When opened, reset view to match the current value (or today if empty)
  useEffect(() => {
    if (isOpen) {
      setViewMode(mode);
      if (value) {
        const parts = value.split('-');
        setViewDate(new Date(parseInt(parts[0], 10), parts[1] ? parseInt(parts[1], 10) - 1 : 0, 1));
      } else {
        setViewDate(new Date());
      }
    }
  }, [isOpen, value, mode]);

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
    const parts = value.split('-');
    const d = new Date(parseInt(parts[0], 10), parts[1] ? parseInt(parts[1], 10) - 1 : 0, parts[2] ? parseInt(parts[2], 10) : 1);
    if (isNaN(d.getTime())) return value;

    if (mode === 'year') return d.getFullYear();
    if (mode === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // View navigation
  const prev = () => {
    const d = new Date(viewDate);
    if (viewMode === 'year') d.setFullYear(d.getFullYear() - 12);
    else if (viewMode === 'month') d.setFullYear(d.getFullYear() - 1);
    else d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const next = () => {
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
      onChange(formatOutput(d));
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
      onChange(formatOutput(d));
      setIsOpen(false);
    } else {
      setViewMode('date');
    }
  };

  const handleSelectDate = (d) => {
    onChange(formatOutput(d));
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
          return (
            <button
              key={y}
              type="button"
              onClick={() => handleSelectYear(y)}
              className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                isSelected ? 'bg-primary text-white font-semibold' : 'hover:bg-primary/10 text-text'
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
          return (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectMonth(i)}
              className={`py-2 px-1 text-sm rounded-lg transition-colors ${
                isSelected ? 'bg-primary text-white font-semibold' : 'hover:bg-primary/10 text-text'
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

    let selectedTime = null;
    if (value && value.split('-').length === 3) {
      const p = value.split('-');
      selectedTime = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
    }

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
            const isSelected = selectedTime === d.getTime();
            const isToday = new Date().toDateString() === d.toDateString();
            
            let btnClass = 'w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors ';
            if (isSelected) btnClass += 'bg-primary text-white font-semibold shadow-md ';
            else if (isToday) btnClass += 'bg-primary/10 text-primary font-semibold hover:bg-primary/20 ';
            else btnClass += 'text-text hover:bg-surface-secondary ';

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectDate(d)}
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
      {/* Trigger Input */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="text"
          readOnly
          value={getDisplayValue()}
          placeholder={placeholder}
          className={`${className} cursor-pointer pr-10`}
          disabled={disabled}
        />
        <CalendarIcon className="w-4 h-4 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-surface border border-border rounded-xl shadow-glass overflow-hidden w-[270px] right-0 sm:left-0 sm:right-auto animate-slide-up origin-top text-text">
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
            
            <button type="button" onClick={next} className="p-1.5 hover:bg-surface rounded-lg text-text-secondary hover:text-text transition-colors">
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
        </div>
      )}
    </div>
  );
}
