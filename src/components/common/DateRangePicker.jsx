import React from 'react';
import { Calendar } from 'lucide-react';

export default function DateRangePicker({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
  required,
  className = ''
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Calendar size={16} />
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 bg-input-bg text-text border ${
              error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
            } rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
          />
        </div>
        
        <span className="text-text-secondary font-medium hidden sm:block">to</span>
        
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Calendar size={16} />
          </div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate} // Prevent selecting end date before start date
            className={`w-full pl-10 pr-3 py-2 bg-input-bg text-text border ${
              error ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'
            } rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
          />
        </div>
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}
