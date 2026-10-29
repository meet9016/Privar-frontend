import React, { useEffect, useState } from 'react'
import { Users, CalendarDays, Store, Briefcase, TrendingUp } from 'lucide-react'
import { api } from '../../lib/api'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const target = Number(value) || 0
    if (target === 0) {
      setDisplayValue(0)
      return
    }

    let startTimestamp = null
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(easeOut * target))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(target)
      }
    }
    const frameId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frameId)
  }, [value, duration])

  return <span>{displayValue.toLocaleString('en-IN')}</span>
}

export default function CommunityStats() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    businesses: 0,
    opportunities: 0,
  })

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    window.addEventListener('web-theme-updated', loadTheme)
    return () => {
      window.removeEventListener('storage', loadTheme)
      window.removeEventListener('web-theme-updated', loadTheme)
    }
  }, [])

  // Dynamically load community metrics from admin panel APIs
  useEffect(() => {
    let isMounted = true

    const fetchCounts = async () => {
      try {
        setLoading(true)
        const [membersRes, eventsRes, bizRes, jobsRes] = await Promise.allSettled([
          api.get('/users?flat=true&limit=1'),
          api.get('/events?limit=1'),
          api.get('/businesses?limit=1'),
          api.get('/job-vacancy?limit=1'),
        ])

        if (!isMounted) return

        const extractCount = (res) => {
          if (!res || res.status !== 'fulfilled' || !res.value?.data) return 0
          const d = res.value.data
          if (d.pagination?.total !== undefined && d.pagination?.total !== null) {
            return Number(d.pagination.total) || 0
          }
          if (d.total !== undefined && d.total !== null) {
            return Number(d.total) || 0
          }
          if (d.count !== undefined && d.count !== null) {
            return Number(d.count) || 0
          }
          if (Array.isArray(d.data)) {
            return d.data.length
          }
          return 0
        }

        setStats({
          members: extractCount(membersRes),
          events: extractCount(eventsRes),
          businesses: extractCount(bizRes),
          opportunities: extractCount(jobsRes),
        })
      } catch (err) {
        console.error('Failed to load community impact stats:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCounts()

    return () => {
      isMounted = false
    }
  }, [])

  const primaryColor = theme.primaryColor || '#991B1B'
  const textColor = theme.textColor || '#0a2342'

  const statItems = [
    {
      id: 'members',
      label: 'Total Members',
      count: stats.members,
      desc: 'Registered community members',
      icon: Users,
      color: primaryColor,
      bgLight: `${primaryColor}14`,
    },
    {
      id: 'events',
      label: 'Events Organized',
      count: stats.events,
      desc: 'Celebrations & gatherings',
      icon: CalendarDays,
      color: '#EA580C',
      bgLight: '#EA580C14',
    },
    {
      id: 'businesses',
      label: 'Businesses',
      count: stats.businesses,
      desc: 'Community enterprises listed',
      icon: Store,
      color: '#0D9488',
      bgLight: '#0D948814',
    },
    {
      id: 'opportunities',
      label: 'Job Vacancies',
      count: stats.opportunities,
      desc: 'Career & employment openings',
      icon: Briefcase,
      color: '#6366F1',
      bgLight: '#6366F114',
    },
  ]

  return (
    <section
      id="community-stats"
      className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Stats Card Container */}
        <div
          className="w-full rounded-3xl border py-8 sm:py-10 px-6 sm:px-8 lg:px-10 transition-all duration-300 relative overflow-hidden shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}08 0%, #ffffff 50%, ${primaryColor}04 100%)`,
            borderColor: `${primaryColor}25`,
            borderTopWidth: '4px',
            borderTopColor: primaryColor,
          }}
        >
          {/* Subtle Ambient Decorative Glow Blobs */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col items-center text-center mb-8 sm:mb-10">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-3 px-3.5 py-1.5 rounded-full border bg-white shadow-xs"
              style={{
                color: primaryColor,
                borderColor: `${primaryColor}30`,
              }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="tracking-wide">Community Impact</span>
            </div>

            {/* Heading */}
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight"
              style={{ color: textColor }}
            >
              Our Impact
            </h2>

            {/* Subtitle */}
            <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xl font-medium">
              Real-time progress and growth milestones across our Parivar community
            </p>
          </div>

          {/* 4 Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative z-10">
            {statItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl p-6 sm:p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col items-center text-center overflow-hidden"
                  style={{
                    borderColor: `${item.color}25`,
                    boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* Top Subtle Color Accent Bar */}
                  <div
                    className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full transition-all duration-300 group-hover:left-3 group-hover:right-3"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Icon Badge */}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-108 group-hover:rotate-2 shadow-xs"
                    style={{
                      backgroundColor: item.bgLight,
                      color: item.color,
                      border: `1.5px solid ${item.color}35`,
                    }}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.2} />
                  </div>

                  {/* Stat Number */}
                  <div
                    className="text-3xl sm:text-4xl lg:text-[38px] font-black tracking-tight mb-1 flex items-baseline justify-center"
                    style={{ color: textColor }}
                  >
                    {loading ? (
                      <span className="inline-block w-16 h-9 bg-gray-200 rounded-lg animate-pulse" />
                    ) : (
                      <>
                        <AnimatedNumber value={item.count} />
                        <span
                          className="text-2xl sm:text-3xl font-bold ml-0.5"
                          style={{ color: item.color }}
                        >
                          +
                        </span>
                      </>
                    )}
                  </div>

                  {/* Label */}
                  <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                    {item.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
