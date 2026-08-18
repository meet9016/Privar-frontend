import React, { createContext, useContext, useState, useEffect } from 'react';
import chroma from 'chroma-js';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('theme-primary-color') || '#4338ca'; // Default primary
  });

  useEffect(() => {
    if (!primaryColor) return;

    localStorage.setItem('theme-primary-color', primaryColor);
    
    // Generate color palette based on the primary color
    const baseColor = chroma(primaryColor);
    
    const colors = {
      '--color-primary': baseColor.hex(),
      '--color-primary-hover': baseColor.darken(0.5).hex(),
      '--color-primary-active': baseColor.darken(1).hex(),
      '--color-primary-light': baseColor.brighten(1).hex(),
      '--color-primary-lighter': baseColor.brighten(2).hex(),
      '--color-primary-dark': baseColor.darken(1.5).hex(),
      '--color-primary-bg': chroma.mix('#ffffff', baseColor, 0.12).hex(), // Solid light color to prevent transparency issues
      '--color-primary-glow': baseColor.alpha(0.2).css(),
      '--color-primary-border': baseColor.alpha(0.3).css(),
    };

    // Apply variables to root
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
