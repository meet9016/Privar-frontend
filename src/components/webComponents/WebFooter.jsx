import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle, Menu, X, LogIn } from 'lucide-react'
import NotificationDropdown from '../NotificationDropdown'
import { assetUrl } from '../../lib/api'

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
    'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor',
    'name', 'webLogo', 'favicon', 'phone', 'email', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp',
  ]
  const loadedTheme = {}
  colorKeys.forEach((key) => {
    const value = localStorage.getItem(`web_${key}`)
    if (value) loadedTheme[key] = value
  })
  return loadedTheme
}

export default function WebFooter() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(getStoredWebTheme)
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()

    // Listen for storage changes (if theme is updated elsewhere)
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Members', href: '/members' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Events', href: '/events' },
    { label: 'Students', href: '/students' },
    { label: 'Donors', href: '/donors' },
    { label: 'Matrimonial', href: '/matrimonial' },
    { label: 'Job Vacancies', href: '/jobs' },
    { label: 'Documentation', href: '/documentation' },
  ]

  const socialLinks = [
    { icon: Facebook, href: theme?.facebook || '#facebook', label: 'Facebook' },
    { icon: Instagram, href: theme?.instagram || '#instagram', label: 'Instagram' },
    { icon: Twitter, href: theme?.twitter || '#twitter', label: 'Twitter' },
    { icon: Youtube, href: theme?.youtube || '#youtube', label: 'YouTube' },
    { icon: MessageCircle, href: theme?.whatsapp || '#whatsapp', label: 'WhatsApp' },
  ]

  const shadeColor = (color, percent) => {
    if (!color) return '#000000'
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, (num >> 16) + amt).toString(16).padStart(2, '0')
    const G = Math.max(0, ((num >> 8) & 0x00FF) + amt).toString(16).padStart(2, '0')
    const B = Math.max(0, (num & 0x0000FF) + amt).toString(16).padStart(2, '0')
    return `#${R}${G}${B}`
  }

  return (
    <>
      {/* ═══════════════════════════════════════
          SIMPLE CLEAN FOOTER
      ═══════════════════════════════════════ */}
      <footer
        className="relative mt-auto overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${theme.primaryColor || '#1a3c2e'}, ${theme.gradientEnd || '#0d2418'})`
        }}
      >

        {/* ── Content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">

          {/* ── Top 4-column grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

            {/* Col 1 — Brand */}
            <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
              {theme?.webLogo && (
                <img
                  src={assetUrl(theme.webLogo)}
                  alt={theme.name}
                  className="h-14 w-auto object-contain drop-shadow-lg"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                />
              )}
              <div>
                <h2 className="text-white text-2xl font-black leading-tight tracking-tight">
                  {theme?.name || 'Parivar'}
                </h2>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-0.5">
                  Community Platform
                </p>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">
                Connecting families, celebrating traditions, and building a stronger community — together.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      <Icon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-200" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Col 2 — Quick Links */}
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-white text-[13px] font-black uppercase tracking-[0.18em]">Quick Links</h3>
                <div className="w-8 h-[2px] rounded-full mt-2" style={{ backgroundColor: theme.primaryColor || '#4caf50' }} />
              </div>
              <nav className="flex flex-col gap-2.5">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="group flex items-center gap-2.5 text-white/60 text-sm font-semibold hover:text-white transition-colors duration-200"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-150"
                      style={{ backgroundColor: theme.primaryColor || '#4caf50' }}
                    />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Col 3 — Contact */}
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-white text-[13px] font-black uppercase tracking-[0.18em]">Contact Us</h3>
                <div className="w-8 h-[2px] rounded-full mt-2" style={{ backgroundColor: theme.primaryColor || '#4caf50' }} />
              </div>
              <div className="flex flex-col gap-4">
                {theme?.phone && (
                  <a
                    href={`tel:${theme.phone}`}
                    className="group flex items-start gap-3 text-white/60 text-sm font-semibold hover:text-white transition-colors duration-200"
                  >
                    <div
                      className="mt-0.5 p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${theme.primaryColor || '#4caf50'}30` }}
                    >
                      <Phone className="w-3.5 h-3.5" style={{ color: theme.primaryColor || '#4caf50' }} />
                    </div>
                    <div>
                      <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-0.5">Phone</p>
                      {theme.phone}
                    </div>
                  </a>
                )}
                {theme?.email && (
                  <a
                    href={`mailto:${theme.email}`}
                    className="group flex items-start gap-3 text-white/60 text-sm font-semibold hover:text-white transition-colors duration-200"
                  >
                    <div
                      className="mt-0.5 p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${theme.primaryColor || '#4caf50'}30` }}
                    >
                      <Mail className="w-3.5 h-3.5" style={{ color: theme.primaryColor || '#4caf50' }} />
                    </div>
                    <div>
                      <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-0.5">Email</p>
                      {theme.email}
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Col 4 — Community tagline / quote */}
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-white text-[13px] font-black uppercase tracking-[0.18em]">Our Values</h3>
                <div className="w-8 h-[2px] rounded-full mt-2" style={{ backgroundColor: theme.primaryColor || '#4caf50' }} />
              </div>
              <blockquote className="border-l-2 pl-4 text-white/55 text-sm leading-relaxed italic" style={{ borderColor: theme.primaryColor || '#4caf50' }}>
                "Family is not an important thing, it's everything. We bring community closer through shared values and traditions."
              </blockquote>
              <div
                className="flex items-center gap-3 mt-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                  style={{ backgroundImage: `linear-gradient(135deg, ${theme.primaryColor || '#4caf50'}, ${theme.gradientEnd || '#0d6e3a'})` }}
                >
                  {(theme?.name || 'P')[0]}
                </div>
                <div>
                  <p className="text-white font-black text-sm">{theme?.name || 'Parivar'}</p>
                  <p className="text-white/40 text-[11px]">Est. Community</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
            <span>
              © {new Date().getFullYear()} {theme?.name || 'Parivar'}. All rights reserved.
            </span>
            <nav className="flex items-center gap-1" aria-label="Legal">
              <a
                href="/privacy-policy"
                className="px-3 py-1 rounded-md hover:text-white/70 hover:bg-white/5 transition-all duration-200"
              >
                Privacy Policy
              </a>
              <span className="opacity-30">·</span>
              <a
                href="/terms-and-conditions"
                className="px-3 py-1 rounded-md hover:text-white/70 hover:bg-white/5 transition-all duration-200"
              >
                Terms &amp; Conditions
              </a>
            </nav>
          </div>

        </div>
      </footer>
    </>
  )
}
