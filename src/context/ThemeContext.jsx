import React, { createContext, useContext, useState, useEffect } from 'react';
import chroma from 'chroma-js';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
];

export const ThemeProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('theme-primary-color') || '#4338ca'; // Default primary
  });

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('app-language') || 'en';
  });

  // Apply Language Change across Entire Admin Panel & Website
  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('app-language', langCode);

    // Set Google Translate cookie
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    if (domain !== 'localhost') {
      document.cookie = `googtrans=/en/${langCode}; domain=.${domain}; path=/;`;
    }

    // Trigger Google Translate dropdown change
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // Reload page if needed to apply clean translation
      window.location.reload();
    }
  };

  useEffect(() => {
    // Ensure Google Translate script is loaded
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,gu,hi',
              autoDisplay: false,
            },
            'google_translate_hidden_element'
          );

          // Apply initial stored language after a brief delay
          const storedLang = localStorage.getItem('app-language');
          if (storedLang && storedLang !== 'en') {
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo');
              if (select && select.value !== storedLang) {
                select.value = storedLang;
                select.dispatchEvent(new Event('change'));
              }
            }, 500);
          }
        }
      };

      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

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
      '--color-primary-bg': chroma.mix('#ffffff', baseColor, 0.12).hex(),
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
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, currentLanguage, changeLanguage, languages: SUPPORTED_LANGUAGES }}>
      {/* Hidden Translate Anchor */}
      <div id="google_translate_hidden_element" style={{ display: 'none' }}></div>
      {children}
    </ThemeContext.Provider>
  );
};
