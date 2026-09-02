import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Key } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { toast } from '../lib/toast'
import { getCommunitySurname, getCommunityFullName, getDomainCommunityName, getSubdomainTenant, assetUrl } from '../lib/api'

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

  useEffect(() => {
    const loadWebTheme = () => {
      const currentSubdomain = getSubdomainTenant()
      let name = localStorage.getItem('web_name') || ''
      if (currentSubdomain && name && !name.toLowerCase().includes(currentSubdomain.toLowerCase())) {
        name = `${currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)} Parivar`
        localStorage.setItem('web_name', name)
      }

      setWebTheme({
        webLogo: localStorage.getItem('web_logo') || localStorage.getItem('web_webLogo') || '',
        name: getDomainCommunityName() || getCommunityFullName()
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

  const domainName = getDomainCommunityName()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text relative overflow-hidden font-sans">
      
      {/* Dynamic ambient backgrounds */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-3xl shadow-glass-lg relative z-10 animate-slide-up">
        
        {/* Header Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {domainName.toLowerCase().includes('parivar') ? domainName : `${domainName} Parivar`}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-2 tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-input-bg text-text placeholder-text-secondary/40 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-2 tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input-bg text-text placeholder-text-secondary/40 border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-secondary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2.5 mt-2">
            <input 
              type="checkbox" 
              id="agree" 
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 shrink-0 w-4 h-4 rounded border border-border text-primary focus:ring-primary/50 bg-input-bg cursor-pointer"
            />
            <label htmlFor="agree" className="text-xs text-text-secondary leading-snug cursor-pointer select-none">
              I agree to the <a href="#" onClick={e => e.preventDefault()} className="text-primary hover:underline">Privacy Policy</a> and <a href="#" onClick={e => e.preventDefault()} className="text-primary hover:underline">Terms & Conditions</a>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary hover:bg-primary-hover hover:shadow-glow-primary text-white py-3.5 rounded-2xl font-semibold text-sm tracking-wider  transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Login...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

