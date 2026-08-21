import React, { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
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
        const response = await memberApi.get('/businesses?status=1')
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
  // Duplicate items heavily to ensure they fill wide screens and prevent white space.
  // Using an even number of duplications ensures translateX(-50%) works perfectly.
  const doubled = Array(12).fill(visibleBusinesses).flat()

  return (
    <section
      id="businesses"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 flex flex-col items-center text-center mb-12 sm:mb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-sm"
            style={{
              color: theme.primaryColor,
              borderColor: `${theme.primaryColor}30`,
            }}
          >
            <Briefcase className="w-4 h-4" style={{ color: theme.primaryColor }} />
            <span>Businesses</span>
          </div>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight mb-3"
            style={{ color: theme.textColor }}
          >
            Our Community Businesses
          </h2>
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
        <div style={{
          overflow: 'hidden', position: 'relative',
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              width: 'max-content',
              padding: '10px 12px', // 12px + 12px = 24px (equals gap) to make the -50% scroll mathematically seamless
              animation: 'scroll-left 90s linear infinite', // Slowed down slightly for smoother readability
            }}
            onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
          >
            {doubled.map((biz, i) => (
              <article
                key={`${biz.id}-${i}`}
                className="group relative flex-shrink-0 w-[220px] sm:w-[240px] rounded-lg overflow-hidden transition-all duration-500 bg-white border"
                style={{
                  borderColor: `${theme.borderColor}50`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                {/* Flat Square Image (Edge-to-Edge) */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={biz.image}
                    alt={biz.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    draggable={false}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                </div>

                {/* Text Content */}
                <div className="px-4 pt-3 pb-4 text-center relative z-20 bg-white flex flex-col items-center">
                  <h3
                    className="text-base sm:text-[17px] font-bold mb-1.5 w-full truncate transition-colors duration-300"
                    style={{ color: theme.primaryColor }}
                  >
                    {biz.name}
                  </h3>
                  <div
                    className="inline-flex items-center justify-center text-[11px] sm:text-[12px] font-medium tracking-wide px-3 py-0.5 rounded-full border bg-white"
                    style={{
                      color: theme.primaryColor,
                      borderColor: theme.primaryColor,
                    }}
                  >
                    {biz.role}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}