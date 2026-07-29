import React, { useState, useRef, useEffect } from 'react'
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle, Menu, X, LogIn } from 'lucide-react'
import NotificationDropdown from '../NotificationDropdown'
import { assetUrl } from '../../lib/api'

export default function WebFooter() {
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
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Members', href: '#members' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Events', href: '#events' },
    { label: 'Students', href: '#students' },
    { label: 'Donors', href: '#donors' },
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
      {/* FOOTER */}
      <footer
        className="border-t mt-auto"
        style={{
          backgroundColor: theme.backgroundColor || '#F5FFF7',
          borderColor: theme.borderColor || '#D7EFD9',
          color: theme.textColor || '#123524'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo & Name - left */}
            <div className="flex items-center gap-3">
              {theme?.webLogo ? (
                <img src={assetUrl(theme.webLogo)} alt={`${theme.name} logo`} className="h-9 object-contain" />
              ) : null}
              <span className="text-sm font-medium">{theme?.name}</span>
            </div>

            {/* Contact & Social - right */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
              <a
                href={theme?.phone ? `tel:${theme.phone}` : '#'}
                className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
                style={{ color: theme.textColor || '#123524' }}
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>{theme?.phone}</span>
              </a>
              <a
              
                href={theme?.email ? `mailto:${theme.email}` : '#'}
                className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
                style={{ color: theme.textColor || '#123524' }}
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{theme?.email}</span>
              </a>
              <div className="flex items-center gap-3">
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
                      className="rounded-full p-1.5 transition-all duration-200"
                      style={{
                        border: `1px solid ${shadeColor(theme.textColor || '#123524', -80)}`,
                        color: theme.textColor || '#123524'
                      }}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom: Legal Links + Copyright */}
          <div
            className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
            style={{ borderColor: theme.borderColor || '#D7EFD9' }}
          >
            <span style={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} {theme?.name} Parivar. All rights reserved.
            </span>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
              <a
              
                href="/privacy-policy"
                className="transition-opacity duration-200 hover:opacity-70"
                style={{ color: theme.textColor || '#123524' }}
              >
                Privacy Policy
              </a>
              <a
              
                href="/terms-and-conditions"
                className="transition-opacity duration-200 hover:opacity-70"
                style={{ color: theme.textColor || '#123524' }}
              >
                Terms & Conditions
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  )
}
