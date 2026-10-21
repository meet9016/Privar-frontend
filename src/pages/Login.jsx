import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Building2 } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { toast } from '../lib/toast'
import { getDomainCommunityName, getSubdomainTenant, getActualSubdomain, assetUrl } from '../lib/api'

export default function Login() {
  const { login, token } = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [webTheme, setWebTheme] = useState({ webLogo: '', name: '' })
  const [agree, setAgree] = useState(false)

  useEffect(() => {
    if (token) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [token, navigate])

  // Auto-fill test credentials for Chovatiya tenant / local testing
  useEffect(() => {
    const host = window.location.hostname.toLowerCase()
    const currentSub = (getSubdomainTenant() || getActualSubdomain() || '').toLowerCase()

    if (
      host.includes('chovatiya') || 
      currentSub.includes('chovatiya') || 
      host === 'localhost' || 
      host === '127.0.0.1'
    ) {
      setEmail('bhavik@gmail.com')
      setPassword('123456')
      setAgree(true)
    }
  }, [])

  useEffect(() => {
    const loadWebTheme = () => {
      const actualSubdomain = getActualSubdomain()
      let name = localStorage.getItem('web_name') || ''
      if (actualSubdomain && name && !name.toLowerCase().includes(actualSubdomain.toLowerCase())) {
        name = `${actualSubdomain.charAt(0).toUpperCase() + actualSubdomain.slice(1)} Parivar`
        localStorage.setItem('web_name', name)
      }

      setWebTheme({
        webLogo: localStorage.getItem('web_logo') || localStorage.getItem('web_webLogo') || '',
        name: actualSubdomain
          ? `${actualSubdomain.charAt(0).toUpperCase() + actualSubdomain.slice(1)} Parivar`
          : (localStorage.getItem('web_name') || getDomainCommunityName() || 'Chovatiya Parivar')
      })
    }

    loadWebTheme()
    window.addEventListener('storage', loadWebTheme)
    window.addEventListener('web-theme-updated', loadWebTheme)

    return () => {
      window.removeEventListener('storage', loadWebTheme)
      window.removeEventListener('web-theme-updated', loadWebTheme)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || !email.trim() || !password.trim()) {
      const message = 'Please provide both email and password.'
      setError(message)
      toast.error(message)
      return
    }
    if (!agree) {
      const message = 'You must agree to the Privacy Policy and Terms & Conditions.'
      setError(message)
      toast.error(message)
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Login successful')
      navigate('/admin')
    } catch (err) {
      const message = err.message || 'Access Denied: Invalid administrator credentials.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const actualSubdomain = getActualSubdomain()
  const domainName = getDomainCommunityName()
  const titleName = webTheme.name || (
    actualSubdomain
      ? `${actualSubdomain.charAt(0).toUpperCase() + actualSubdomain.slice(1)} Parivar`
      : (domainName ? (domainName.toLowerCase().includes('parivar') ? domainName : `${domainName} Parivar`) : 'Chovatiya Parivar')
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-background text-text relative overflow-hidden font-sans p-4">

      {/* Subtle concentric ambient background rings matching reference */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <div className="w-[500px] h-[500px] rounded-full border border-slate-200/50 dark:border-border/20 absolute"></div>
        <div className="w-[850px] h-[850px] rounded-full border border-slate-200/40 dark:border-border/15 absolute"></div>
        <div className="w-[1250px] h-[1250px] rounded-full border border-slate-200/30 dark:border-border/10 absolute"></div>
        <div className="w-[1650px] h-[1650px] rounded-full border border-slate-200/20 dark:border-border/5 absolute"></div>
      </div>

      {/* Login Card with Blue Top Accent Bar */}
      <div className="w-full max-w-[420px] bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none relative z-10 overflow-hidden animate-slide-up">
        {/* Blue top accent bar */}
        <div className="h-1.5 w-full bg-[#1E6FD9]"></div>

        <div className="p-6 sm:p-8">
          {/* Logo container */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-surface-secondary border border-slate-100 dark:border-border/80 flex items-center justify-center shadow-xs mb-3 overflow-hidden p-1.5">
              {webTheme.webLogo ? (
                <img
                  src={assetUrl(webTheme.webLogo)}
                  alt={titleName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-7 h-7 text-[#1E6FD9]" />
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-text tracking-tight">
              {titleName}
            </h1>
            <p className="text-xs text-slate-400 dark:text-text-secondary mt-0.5 font-medium">
              Admin Portal Sign In
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-text-secondary mb-1.5 tracking-wide">
                Email Address
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-input-bg focus-within:border-[#1E6FD9] focus-within:ring-2 focus-within:ring-[#1E6FD9]/15 transition-all shadow-xs">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 bg-transparent text-slate-800 dark:text-text placeholder-slate-400 outline-none"
                  placeholder="admin@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-text-secondary mb-1.5 tracking-wide">
                Password
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-input-bg focus-within:border-[#1E6FD9] focus-within:ring-2 focus-within:ring-[#1E6FD9]/15 transition-all shadow-xs">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 bg-transparent text-slate-800 dark:text-text placeholder-slate-400 outline-none"
                  placeholder="••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-text transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1E6FD9] focus:ring-[#1E6FD9]/40 cursor-pointer"
              />
              <label htmlFor="agree" className="text-[11px] text-slate-500 dark:text-text-secondary cursor-pointer select-none leading-snug">
                I agree to the{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#1E6FD9] hover:underline font-medium">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-[#1E6FD9] hover:underline font-medium">
                  Terms & Conditions
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#1E6FD9] hover:bg-[#185DC0] active:scale-[0.99] text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure 256-bit encryption note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-text-muted mt-5 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Secure 256-bit encrypted administrator login</span>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <p className="text-[11px] text-slate-400 dark:text-text-muted mt-6 text-center select-none z-10">
        © {new Date().getFullYear()} {titleName}. All rights reserved.
      </p>
    </div>
  )
}
