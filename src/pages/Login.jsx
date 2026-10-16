import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { toast } from '../lib/toast'
import {
  getCommunitySurname,
  getCommunityFullName,
  getDomainCommunityName,
  getSubdomainTenant,
  getActualSubdomain,
  assetUrl
} from '../lib/api'
import { useWebTheme } from '../hooks/useWebTheme'

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor',
    'borderColor',
    'buttonColor',
    'fontColor',
    'gradientEnd',
    'gradientStart',
    'primaryColor',
    'secondaryColor',
    'textColor',
    'webLogo',
    'appLogo',
    'name'
  ]
  return colorKeys.reduce((acc, key) => {
    const val = localStorage.getItem(`web_${key}`)
    return val ? { ...acc, [key]: val } : acc
  }, {})
}

export default function Login() {
  // Sync latest theme from backend API
  useWebTheme()

  const { login, token } = useContext(AuthContext)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)
  const [theme, setTheme] = useState(getStoredWebTheme())

  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user')
    const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token')
    if (token && storedUser && storedToken) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [token, navigate])

  // Auto-fill test credentials for Chovatiya tenant / local testing
  useEffect(() => {
    const host = window.location.hostname.toLowerCase()
    const currentSub = (getSubdomainTenant() || getActualSubdomain() || '').toLowerCase()
    const tName = (theme.name || localStorage.getItem('web_name') || '').toLowerCase()

    if (
      host.includes('chovatiya') || 
      currentSub.includes('chovatiya') || 
      tName.includes('chovatiya') || 
      host === 'localhost' || 
      host === '127.0.0.1'
    ) {
      setEmail('bhavik@gmail.com')
      setPassword('123456')
      setAgree(true)
    }
  }, [theme.name])

  // Keep theme state synchronized with localStorage and events
  useEffect(() => {
    const syncTheme = () => {
      setTheme(getStoredWebTheme())
    }

    syncTheme()
    window.addEventListener('storage', syncTheme)
    window.addEventListener('web-theme-updated', syncTheme)

    return () => {
      window.removeEventListener('storage', syncTheme)
      window.removeEventListener('web-theme-updated', syncTheme)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || !email.trim() || !password.trim()) {
      const msg = 'Please enter your email and password.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (!agree) {
      const msg = 'Please agree to the Privacy Policy and Terms & Conditions to proceed.'
      setError(msg)
      toast.error(msg)
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! Logged in successfully.')
      navigate('/admin')
    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Tenant / Community identity resolution
  const actualSub = getActualSubdomain()
  let communityTitle = theme.name || ''
  if (actualSub && (!communityTitle || !communityTitle.toLowerCase().includes(actualSub.toLowerCase()))) {
    communityTitle = `${actualSub.charAt(0).toUpperCase() + actualSub.slice(1)} Parivar`
  } else if (!communityTitle) {
    const fallback = getDomainCommunityName() || getCommunityFullName() || 'Parivar'
    communityTitle = fallback.toLowerCase().includes('parivar') ? fallback : `${fallback} Parivar`
  }
  communityTitle = communityTitle.trim()
  if (!communityTitle.toLowerCase().includes('parivar')) {
    communityTitle = `${communityTitle} Parivar`
  }

  const rawLogo = theme.webLogo || theme.appLogo || localStorage.getItem('web_logo') || localStorage.getItem('web_webLogo')
  const logoUrl = rawLogo ? assetUrl(rawLogo) : '/parivar.png'

  // Dynamic Theme Colors
  const primaryColor = theme.primaryColor || '#1565C0'
  const buttonColor = theme.buttonColor || primaryColor
  const backgroundColor = theme.backgroundColor || '#F8FAFC'
  const textColor = theme.textColor || '#0F172A'
  const borderColor = theme.borderColor || '#E2E8F0'

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-800 relative selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden"
      style={{ backgroundColor }}
    >
      {/* Subtle modern background texture and gentle ambient accents */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 -z-0"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${primaryColor}14 0%, transparent 60%)`
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.025] -z-0 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Main Single Card Container */}
      <div className="w-full max-w-[440px] my-auto relative z-10 animate-fade-in">
        
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_10px_35px_-5px_rgba(15,23,42,0.08),0_2px_8px_-2px_rgba(15,23,42,0.04)] border border-slate-200 overflow-hidden transition-all">
          
          {/* Top Brand Color Strip */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="p-7 sm:p-9">
            
            {/* Header: Community Logo & Title */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2.5 mb-3.5 shadow-2xs">
                <img
                  src={logoUrl}
                  alt={communityTitle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/parivar.png'
                  }}
                />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {communityTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Admin Portal Sign In
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={loading}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-xl text-sm font-medium outline-none transition-all"
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 3px ${primaryColor}18`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={loading}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-xl text-sm font-medium outline-none transition-all"
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 3px ${primaryColor}18`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 cursor-pointer"
                    style={{ accentColor: primaryColor }}
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    I agree to the{' '}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a
                      href="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Terms & Conditions
                    </a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 px-5 rounded-xl font-semibold text-sm text-white shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                style={{
                  backgroundColor: buttonColor
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.filter = 'brightness(0.92)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none'
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Security Divider */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11.5px] text-slate-400 font-normal flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secure 256-bit encrypted administrator login</span>
              </p>
            </div>

          </div>
        </div>

        {/* Clean Footer Below Card */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400 font-normal">
            © {new Date().getFullYear()} {communityTitle}. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  )
}
