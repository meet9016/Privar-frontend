import React, { createContext, useContext, useState, useEffect } from 'react';
import chroma from 'chroma-js';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('web_primaryColor') || localStorage.getItem('theme-primary-color') || '#1565C0';
  });

  useEffect(() => {
    const handleThemeUpdate = () => {
      const storedColor = localStorage.getItem('web_primaryColor') || localStorage.getItem('theme-primary-color');
      if (storedColor && storedColor !== primaryColor) {
        setPrimaryColor(storedColor);
      }
    };

    window.addEventListener('web-theme-updated', handleThemeUpdate);
    window.addEventListener('storage', handleThemeUpdate);
    return () => {
      window.removeEventListener('web-theme-updated', handleThemeUpdate);
      window.removeEventListener('storage', handleThemeUpdate);
    };
  }, [primaryColor]);

  useEffect(() => {
    if (!primaryColor) return;

    localStorage.setItem('theme-primary-color', primaryColor);
    
    // Generate color palette based on the primary color
    try {
      const baseColor = chroma(primaryColor);
      
      const colors = {
        '--color-primary': baseColor.hex(),
        '--color-primary-hover': baseColor.darken(0.4).hex(),
        '--color-primary-active': baseColor.darken(0.8).hex(),
        '--color-primary-light': baseColor.brighten(0.8).hex(),
        '--color-primary-lighter': baseColor.brighten(1.5).hex(),
        '--color-primary-dark': baseColor.darken(1.2).hex(),
        '--color-primary-bg': chroma.mix('#ffffff', baseColor, 0.08).hex(),
        '--color-primary-glow': baseColor.alpha(0.15).css(),
        '--color-primary-border': baseColor.alpha(0.25).css(),
      };

      // Apply variables to root
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    } catch (e) {
      console.warn('Could not parse primary color with chroma:', e);
    }
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

