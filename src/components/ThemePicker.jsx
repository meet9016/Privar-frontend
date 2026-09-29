import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#4338ca' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Slate', value: '#475569' }
];

export default function ThemePicker() {
  const { primaryColor, setPrimaryColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-secondary border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        title="Theme Settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-4 bg-surface border border-border rounded-2xl shadow-glass-lg z-50 animate-fade-in">
          {/* Theme Color Presets */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">Theme Color</h3>
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setPrimaryColor(preset.value)}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  style={{ 
                    backgroundColor: preset.value,
                    borderColor: primaryColor === preset.value ? 'var(--color-surface)' : 'transparent',
                    boxShadow: primaryColor === preset.value ? `0 0 0 2px ${preset.value}` : 'none'
                  }}
                  title={preset.name}
                >
                  {primaryColor === preset.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Custom Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono font-bold text-text uppercase border border-border px-2 py-1.5 rounded-lg bg-surface-secondary flex-1 text-center">
                  {primaryColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
