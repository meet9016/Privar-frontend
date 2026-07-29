import React, { createContext, useState, useCallback, useEffect } from 'react'

export const AuthContext = createContext()

const storeWebTheme = (themeData) => {
  if (!themeData) return

  const themeKeys = [
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
    'instagram',
    'twitter',
    'youtube',
    'whatsapp'
  ]

  themeKeys.forEach((key) => {
    const value = themeData[key]
    const storageKey = `web_${key}`

    if (value === undefined || value === null || value === '') {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, value)
    }
  })
}

/**
 * Fetch and cache WEBSITE theme colors from backend
 * 
 * IMPORTANT: This is ONLY for website pages (WebHeader, etc.)
 * Admin dashboard uses separate theme system (CSS variables in theme.js)
 * 
 * Website theme colors are stored with 'web_' prefix in localStorage:
 * - web_primaryColor, web_backgroundColor, web_gradientStart, etc.
 * 
 * NO CONFLICT with admin dashboard theme colors!
 */
const fetchWebTheme = async () => {
  try {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
      const response = await fetch(`${apiBase}/api/get_app_theme`)
    if (!response.ok) {
      throw new Error(`Theme fetch failed with status ${response.status}`)
    }

    const json = await response.json()
    const themeData = json.data || json

    if (themeData) {
      storeWebTheme(themeData)
      window.dispatchEvent(new Event('web-theme-updated'))
            window.dispatchEvent(new Event('storage'))
    }
  } catch (err) {
    console.error('Failed to fetch web theme:', err.message)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage and fetch theme
  useEffect(() => {
    const init = async () => {
      // Restore auth state
      const stored = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      if (stored) {
        setToken(stored)
        setUser(storedUser ? JSON.parse(storedUser) : null)
      }

      // Fetch website theme colors (separate from admin dashboard theme)
      // Stored as web_* localStorage keys to prevent conflicts
      await fetchWebTheme()

      setLoading(false)
    }

    init()
  }, [])

  const login = useCallback(async (email, password) => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
    const res = await fetch(`${apiBase}/api/admin_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
    }

    const json = await res.json()
    const payload = json.data || json // Support nested {data: {token, user}} and flat responses
    
    const { token: receivedToken, user: receivedUser } = payload
    
    if (!receivedToken || !receivedUser) {
      throw new Error('Invalid login response from server')
    }

    setToken(receivedToken)
    setUser(receivedUser)
    localStorage.setItem('auth_token', receivedToken)
    localStorage.setItem('auth_user', JSON.stringify(receivedUser))
    return { token: receivedToken, user: receivedUser }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
