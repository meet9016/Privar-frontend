import React, { useEffect, useState } from 'react'
import { Users, CalendarDays, Store, Briefcase } from 'lucide-react'
import { memberApi } from '../../lib/api'

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

export default function CommunityStats() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [stats, setStats] = useState({
    members: '5,000+',
    events: '120+',
    businesses: '50+',
    opportunities: '100+',
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

  // Dynamically load community metrics if API endpoints return counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [membersRes, eventsRes, bizRes, jobsRes] = await Promise.allSettled([
          memberApi.get('/users?limit=1'),
          memberApi.get('/events?limit=1'),
          memberApi.get('/businesses?status=1&limit=1'),
          memberApi.get('/job-vacancy?limit=1'),
        ])

        setStats((prev) => {
          const next = { ...prev }

          if (membersRes.status === 'fulfilled') {
            const count =
              membersRes.value?.data?.total ??
              membersRes.value?.data?.count ??
              membersRes.value?.data?.pagination?.total
            if (count && Number(count) > 0) {
              next.members = `${Number(count).toLocaleString()}+`
            }
          }

          if (eventsRes.status === 'fulfilled') {
            const count =
              eventsRes.value?.data?.total ??
              eventsRes.value?.data?.count ??
              eventsRes.value?.data?.pagination?.total ??
              (Array.isArray(eventsRes.value?.data?.data) ? eventsRes.value.data.data.length : null)
            if (count && Number(count) > 0) {
              next.events = `${Number(count).toLocaleString()}+`
            }
          }

          if (bizRes.status === 'fulfilled') {
            const count =
              bizRes.value?.data?.total ??
              bizRes.value?.data?.count ??
              bizRes.value?.data?.pagination?.total ??
              (Array.isArray(bizRes.value?.data?.data) ? bizRes.value.data.data.length : null)
            if (count && Number(count) > 0) {
              next.businesses = `${Number(count).toLocaleString()}+`
            }
          }

          if (jobsRes.status === 'fulfilled') {
            const count =
              jobsRes.value?.data?.total ??
              jobsRes.value?.data?.count ??
              jobsRes.value?.data?.pagination?.total ??
              (Array.isArray(jobsRes.value?.data?.data) ? jobsRes.value.data.data.length : null)
            if (count && Number(count) > 0) {
              next.opportunities = `${Number(count).toLocaleString()}+`
            }
          }

          return next
        })
      } catch {
        // Keep reference defaults (5,000+, 120+, 50+, 100+)
      }
    }

    fetchCounts()
  }, [])

  const primaryColor = theme.primaryColor || '#991B1B'
  const textColor = theme.textColor || '#0a2342'

  const statItems = [
    {
      id: 'members',
      label: 'Members',
      value: stats.members,
      icon: Users,
    },
    {
      id: 'events',
      label: 'Events',
      value: stats.events,
      icon: CalendarDays,
    },
    {
      id: 'businesses',
      label: 'Businesses',
      value: stats.businesses,
      icon: Store,
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      value: stats.opportunities,
      icon: Briefcase,
    },
  ]

  return (
    <section
      id="community-stats"
      className="w-full px-4 sm:px-6 lg:px-8 pt-0 pb-12 sm:pb-14 lg:pb-16 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor || 'transparent',
        paddingTop: 0,
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Main Stats Card Container with Light Dynamic Theme Background, Full 1px Border & Primary Top Border */}
        <div
          className="w-full rounded-2xl sm:rounded-3xl border py-8 sm:py-10 lg:py-8 px-6 sm:px-10 lg:px-12 transition-all duration-300 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}0d 0%, #ffffff 50%, ${primaryColor}08 100%)`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: `${primaryColor}30`,
            borderTopWidth: '4px',
            borderTopColor: primaryColor,
          }}
        >
          {/* Subtle Ambient Decorative Glow Blobs */}
          <div
            className="absolute -top-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          {/* Section Heading */}
          <h2
            className="text-xl sm:text-2xl lg:text-[28px] font-black text-center tracking-tight mb-8 sm:mb-10 lg:mb-12 relative z-10"
            style={{ color: textColor }}
          >
            Our Impact
          </h2>

          {/* 4 Stats Grid */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-0 lg:divide-x relative z-10"
            style={{ borderColor: `${primaryColor}18` }}
          >
            {statItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center text-center px-4 group select-none"
                >
                  {/* Unique Multi-Layered Executive Icon Badge */}
                  <div className="relative mb-3.5 flex items-center justify-center">
                    {/* Soft Ambient Radial Glow behind icon */}
                    <div
                      className="absolute -inset-1 rounded-2xl blur-md opacity-25 transition-all duration-300 group-hover:opacity-70 group-hover:blur-lg"
                      style={{ backgroundColor: `${primaryColor}50` }}
                    />

                    {/* Outer Modern Squircle Badge (Layer 1) */}
                    <div
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] flex items-center justify-center transition-all duration-300 group-hover:scale-108 group-hover:-translate-y-1 shadow-sm"
                      style={{
                        background: `linear-gradient(145deg, #ffffff 0%, ${primaryColor}14 100%)`,
                        border: `1.5px solid ${primaryColor}35`,
                        boxShadow: `0 8px 20px -4px ${primaryColor}22, inset 0 1px 1px rgba(255, 255, 255, 0.95)`,
                      }}
                    >
                      {/* Inner Floating Badge (Layer 2) */}
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                        style={{
                          backgroundColor: `${primaryColor}16`,
                          color: primaryColor,
                          border: `1px solid ${primaryColor}22`,
                        }}
                      >
                        <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
                      </div>

                    
                    </div>
                  </div>

                  {/* Stat Number */}
                  <h3
                    className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight mb-1 transition-colors duration-200"
                    style={{ color: textColor }}
                  >
                    {item.value}
                  </h3>

                  {/* Label */}
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 tracking-wide">
                    {item.label}
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
