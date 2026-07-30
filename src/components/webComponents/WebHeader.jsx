import React, { useState, useRef, useEffect } from 'react'
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle, Menu, X, LogIn, Home, Info, Users, Image as ImageIcon, Calendar, GraduationCap, HeartHandshake } from 'lucide-react'
import NotificationDropdown from '../NotificationDropdown'
import { assetUrl } from '../../lib/api'

export default function WebHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState({})
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    const loadTheme = () => {
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



      setTheme(loadedTheme)
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
    { label: 'Home', href: '#home', icon: Home },
    { label: 'About', href: '#about', icon: Info },
    { label: 'Members', href: '#members', icon: Users },
    { label: 'Gallery', href: '#gallery', icon: ImageIcon },
    { label: 'Events', href: '#events', icon: Calendar },
    { label: 'Students', href: '#students', icon: GraduationCap },
    { label: 'Donors', href: '#donors', icon: HeartHandshake },
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
      {/* TOP CONTACT BAR */}
      <div
        className="sticky top-0 z-40 transition-colors duration-300"
        style={{
          backgroundColor: theme.primaryColor || '#0a2342', // Matching the dark blue in the image
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2.5">
            {/* Contact Info */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <a
                href={theme?.phone ? `tel:${theme.phone}` : 'tel:+919876543210'}
                className="flex items-center gap-2 transition-colors duration-200"
                style={{
                  color: theme.fontColor || '#FFFFFF',
                  opacity: 0.85
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                aria-label="Phone number"
              >
                <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">+91{theme?.phone}</span>
              </a>
              <div
                className="hidden sm:block w-px h-4"
                style={{
                  backgroundColor: shadeColor(theme.fontColor || '#FFFFFF', -30)
                }}
              ></div>
              <a
                href={theme?.email ? `mailto:${theme.email}` : 'mailto:info@parivar.org'}
                className="flex items-center gap-2 transition-colors duration-200"
                style={{
                  color: theme.fontColor || '#FFFFFF',
                  opacity: 0.85
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                aria-label="Email address"
              >
                <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{theme?.email}</span>
              </a>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"

                    aria-label={social.label}
                    title={social.label}
                    className="rounded-md transition-all duration-200 p-1 border border-white/30 hover:border-white/80"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#FFFFFF'
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <header
        className="sticky top-10 z-30 shadow-md border-b transition-colors duration-300"
        style={{
          backgroundColor: theme.backgroundColor || '#F5FFF7',
          borderColor: theme.borderColor || '#D7EFD9'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {theme?.webLogo ? (
                <img src={assetUrl(theme.webLogo)} alt={`${theme.name} logo`} className="h-12 object-contain" />
              ) : null}
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: theme.textColor || '#123524' }}>
                  {theme?.name} Parivar
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-8 flex-1 justify-center px-6">
              {navigationLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold flex items-center gap-1.5 relative group transition-colors duration-200"
                  style={{
                    color: theme.textColor || '#123524'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.primaryColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.textColor || '#123524'
                  }}
                >
                  <link.icon className="w-4 h-4" style={{ color: theme.primaryColor }} aria-hidden="true" />
                  {link.label}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                    style={{
                      backgroundColor: theme.primaryColor
                    }}
                  ></span>
                </a>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Notification Bell - uses socket + DB */}
              <NotificationDropdown
                variant="light"
                iconColor={theme.textColor || '#123524'}
                badgeColor={theme.primaryColor || '#ef4444'}
              />

              {/* Login Button */}
              <a
                href="/login"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: theme.primaryColor || '#0a2342',
                  color: theme.fontColor || '#FFFFFF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primaryColor}60`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
                aria-label="Login"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Login</span>
              </a>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
                className="lg:hidden p-2 rounded-lg transition-colors duration-200"
                style={{
                  color: theme.textColor || '#123524'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = shadeColor(theme.textColor || '#123524', -92)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <nav
              ref={mobileMenuRef}
              className="lg:hidden py-4 px-4 border-t"
              style={{
                borderColor: theme.borderColor || '#D7EFD9'
              }}
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col gap-3 mb-4">
                {navigationLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                    style={{
                      color: theme.textColor || '#123524'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = shadeColor(theme.textColor || '#123524', -92)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Mobile Login Button */}
              <a
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
                style={{
                  backgroundImage: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  color: theme.fontColor || '#FFFFFF'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${theme.primaryColor}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Login</span>
              </a>
            </nav>
          )}
        </div>
      </header>
    </>
  )
}
