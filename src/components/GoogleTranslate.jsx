import React, { useEffect, useState } from 'react'
import { Languages, ChevronDown } from 'lucide-react'

export default function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('English')
  const [themeColors, setThemeColors] = useState({
    primary: '#4f46e5',
    secondary: '#64748b',
    text: '#0f172a',
    background: '#f8fafc'
  })

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ]

  useEffect(() => {
    // Get theme colors from CSS variables
    const getColorFromCSS = (varName) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return value || '#4f46e5'
    }

    setThemeColors({
      primary: getColorFromCSS('--color-primary'),
      secondary: getColorFromCSS('--color-secondary'),
      text: getColorFromCSS('--color-text'),
      background: getColorFromCSS('--color-background')
    })

    // Add Google Translate script
    const script = document.createElement('script')
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.head.appendChild(script)

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,it,pt,ru,hi,zh-CN,ja,ar,ko',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        )
        // Hide the default Google Translate widget
        const gtElement = document.getElementById('google_translate_element')
        if (gtElement) {
          gtElement.style.display = 'none'
        }
      }
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const handleLanguageChange = (langCode) => {
    const langName = languages.find(l => l.code === langCode)?.name
    setCurrentLanguage(langName)

    // Trigger Google Translate
    if (window.google && window.google.translate) {
      const select = document.querySelector('.goog-te-combo')
      if (select) {
        select.value = langCode
        select.dispatchEvent(new Event('change'))
      }
    }

    setIsOpen(false)
  }

  const getContrastText = (bgColor) => {
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155 ? '#000000' : '#FFFFFF'
  }

  const primaryColor = themeColors.primary || '#4f46e5'
  const secondaryColor = themeColors.secondary || '#64748b'
  const textColor = getContrastText(primaryColor)

  return (
    <>
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element"></div>

      <div className="relative">
        {/* Translate Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: primaryColor,
            color: textColor,
            border: `1.5px solid ${secondaryColor}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = secondaryColor
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primaryColor
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          title="Translate Page"
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage}</span>
          <span className="sm:hidden">Translate</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Language Dropdown */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-2xl border animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-sm"
            style={{
              backgroundColor: themeColors.background || '#f8fafc',
              borderColor: secondaryColor,
              borderWidth: '1.5px',
              minWidth: '200px',
            }}
          >
            {/* Arrow */}
            <div
              className="absolute right-4 -top-1.5 w-3 h-3 rotate-45"
              style={{ backgroundColor: themeColors.background || '#f8fafc' }}
            ></div>

            {/* Language List */}
            <div className="p-2 max-h-64 overflow-y-auto scrollbar-hide">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full px-3 py-2.5 text-left text-sm rounded-lg transition-all duration-200 flex items-center gap-2 font-medium hover:shadow-md"
                  style={{
                    backgroundColor: currentLanguage === lang.name ? primaryColor + '20' : 'transparent',
                    color: currentLanguage === lang.name ? primaryColor : themeColors.text || '#0f172a',
                    borderLeft: currentLanguage === lang.name ? `3px solid ${primaryColor}` : '3px solid transparent',
                    paddingLeft: currentLanguage === lang.name ? '10px' : '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor + '10'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentLanguage === lang.name ? primaryColor + '20' : 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-3 py-2 text-sm text-center border-t"
              style={{
                borderTopColor: secondaryColor + '30',
                color: themeColors.text || '#0f172a',
                backgroundColor: primaryColor + '05',
              }}
            >
              Powered by Google Translate
            </div>
          </div>
        )}

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
        )}
      </div>
    </>
  )
}
