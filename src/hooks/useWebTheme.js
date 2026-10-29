import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export const WEB_THEME_KEYS = [
  'backgroundColor',
  'borderColor',
  'buttonColor',
  'fontColor',
  'gradientEnd',
  'gradientStart',
  'primaryColor',
  'secondaryColor',
  'textColor',
  'name',
  'webLogo',
  'favicon',
  'phone',
  'email',
  'facebook',
  'twitter',
  'instagram',
  'youtube',
  'whatsapp',
  'android_app_link',
  'ios_app_link',
  'playstore_url',
  'appstore_url',
  'bannerImages',
]

/**
 * Common utility function to get all stored web theme settings from localStorage.
 * Keys are stored with 'web_' prefix (e.g. 'web_primaryColor').
 * Used across all website components for initial state and storage event listeners.
 * 
 * @returns {Record<string, string>}
 */
export const getStoredWebTheme = () => {
  const loadedTheme = {}
  WEB_THEME_KEYS.forEach((key) => {
    const value = localStorage.getItem(`web_${key}`)
    if (value !== null && value !== undefined && value !== '') {
      loadedTheme[key] = value
    }
  })
  return loadedTheme
}

/**
 * Hook to fetch and manage WEBSITE theme colors from backend
 * 
 * IMPORTANT: This is ONLY for website pages (NOT admin dashboard)
 * Admin dashboard uses separate theme system (CSS variables in theme.js)
 * 
 * Colors stored in localStorage with 'web_' prefix to prevent conflicts:
 * - web_primaryColor, web_backgroundColor, web_gradientStart, etc.
 * 
 * Returns: {
 *   theme: { all theme colors },
 *   loading: boolean,
 *   error: null | string,
 *   refresh: function to manually refresh theme
 * }
 */
export const useWebTheme = () => {
  const [theme, setTheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTheme = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch theme from backend
      const response = await api.get('/get_app_theme')
      
      if (response.status === 200 && response.data?.data) {
        const themeData = response.data.data

        // Store each field with 'web_' prefix in localStorage
        Object.keys(themeData).forEach((key) => {
          const value = themeData[key]
          if (typeof value === 'string' || typeof value === 'number') {
            localStorage.setItem(`web_${key}`, value)
          } else if (Array.isArray(value)) {
            // Store arrays (e.g. bannerImages) as JSON strings
            localStorage.setItem(`web_${key}`, JSON.stringify(value))
          }
        })

        // Notify same-tab components to re-read from localStorage
        // (localStorage.setItem does NOT fire 'storage' events in the same tab)
        window.dispatchEvent(new Event('web-theme-updated'))
        window.dispatchEvent(new Event('storage'))

        setTheme(themeData)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch theme'
      setError(errorMsg)
      console.error('Theme fetch error:', err)

      // Try to load cached theme from localStorage
      const cachedTheme = getStoredWebTheme()
      if (Object.keys(cachedTheme).length > 0) {
        setTheme(cachedTheme)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTheme()
  }, [])

  return {
    theme,
    loading,
    error,
    refresh: fetchTheme
  }
}

/**
 * Utility function to get a stored web theme color
 * @param {string} colorKey - e.g., 'primaryColor', 'buttonColor'
 * @param {string} fallback - fallback color if not found
 * @returns {string} - hex color code
 */
export const getWebThemeColor = (colorKey, fallback = '#000000') => {
  const stored = localStorage.getItem(`web_${colorKey}`)
  return stored || fallback
}

/**
 * Utility function to get all stored web theme colors
 * @returns {object} - object with all web_ prefixed colors
 */
export const getAllWebThemeColors = () => {
  return getStoredWebTheme()
}
