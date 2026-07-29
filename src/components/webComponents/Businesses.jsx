import React, { useEffect, useState } from 'react'
import { memberApi } from '../../lib/api'

const normalizeBusiness = (biz, index) => ({
  id: biz.id || `${biz.name}-${index}`,
  name: biz.name || biz.business_name || 'Business',
  role: biz.category || biz.type || 'Business',
  image: biz.image || biz.logo || "/image.png",
})

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
  ]
  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

const shadeColor = (color, percent) => {
  if (!color) return '#000000'
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt)).toString(16).padStart(2, '0')
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt)).toString(16).padStart(2, '0')
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt)).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export default function Businesses() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }
    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/businesses')
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        setBusinesses(rows.map(normalizeBusiness))
      } catch (error) {
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }
    fetchBusinesses()
  }, [])

  const visibleBusinesses = businesses.length > 0 ? businesses : []
  const doubled = [...visibleBusinesses, ...visibleBusinesses]

  return (
    <section
      id="businesses"
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{
        backgroundColor: theme.backgroundColor,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p
            className="text-sm sm:text-base font-semibold tracking-wide mb-2"
            style={{ color: theme.primaryColor }}
          >
            - Businesses -
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: theme.textColor }}
          >
            Our{' '}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Businesses
            </span>
          </h2>
          <div
            className="w-12 h-1 rounded-full mx-auto mt-4"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
            }}
          />
        </div>
        {loading && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-center text-sm font-semibold"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: shadeColor(theme.backgroundColor, 3),
              color: theme.textColor,
            }}
          >
            Loading businesses...
          </div>
        )}
        <div style={{ overflow: 'hidden', position: 'relative',
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              width: 'max-content',
              animation: 'scroll-left 28s linear infinite',
            }}
            onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
          >
            {doubled.map((biz, i) => (
              <article
                key={`${biz.id}-${i}`}
                style={{
                  width: '220px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  border: `1px solid ${theme.borderColor}`,
                  overflow: 'hidden',
                  backgroundColor: theme.backgroundColor,
                  transition: 'transform 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                  <img
                    src={biz.image}
                    alt={biz.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: theme.textColor, margin: '0 0 6px' }}>
                    {biz.name}
                  </h3>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '3px 14px',
                    borderRadius: '999px',
                    border: `1px solid ${theme.primaryColor}`,
                    color: theme.primaryColor,
                    backgroundColor: shadeColor(theme.backgroundColor, 3),
                  }}>
                    {biz.role}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}