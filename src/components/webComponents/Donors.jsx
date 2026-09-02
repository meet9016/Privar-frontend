import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, HeartHandshake, IndianRupee, MapPin, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
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

const shadeColor = (color, percent) => {
  if (!color) return '#000000'

  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt)).toString(16).padStart(2, '0')
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt)).toString(16).padStart(2, '0')
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt)).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}

const formatAmount = (amount) => {
  const value = Number(amount || 0)
  return value.toLocaleString('en-IN')
}

export default function Donors() {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isDonorsPage = location?.pathname === '/donors'

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await memberApi.get('/donations?status=1')
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows.filter(r => r.status === undefined || r.status === null || Number(r.status) === 1 || String(r.status).toLowerCase() === 'active')
        setDonors(activeRows)
      } catch (err) {
        setError('Unable to load donors right now')
        setDonors([])
      } finally {
        setLoading(false)
      }
    }

    fetchDonors()
  }, [])

  const visibleDonors = isDonorsPage ? donors : donors.slice(0, 4)
  const totalAmount = useMemo(
    () => donors.reduce((sum, donor) => sum + Number(donor.donate_amount || 0), 0),
    [donors]
  )

  return (
    <section
      id="donors"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 flex flex-col items-center text-center mb-12 sm:mb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-sm"
            style={{
              color: theme.primaryColor,
              borderColor: `${theme.primaryColor}30`,
            }}
          >
            <HeartHandshake className="w-4 h-4" style={{ color: theme.primaryColor }} />
            <span>Generous Supporters</span>
          </div>

          {/* Heading */}
          <h2
            className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight mb-3"
            style={{ color: theme.textColor }}
          >
            Our Donors
          </h2>
        </div>


        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-lg border border-gray-100 p-5 flex flex-col min-h-[160px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-20 h-6 rounded-full bg-gray-200 animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-center text-sm font-semibold"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: shadeColor(theme.backgroundColor, 2),
              color: theme.textColor,
            }}
          >
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleDonors.map((donor) => {
                const initials = (donor.donator_name || 'D')
                  .split(' ')
                  .map(w => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()

                return (
                  <article
                    key={donor.id || donor._id}
                    className="group flex flex-col overflow-hidden bg-white rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    style={{ borderColor: `${theme.borderColor}40` }}
                  >
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Top Row: Avatar & Amount */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                          style={{
                            backgroundColor: `${theme.primaryColor}15`,
                            color: theme.primaryColor,
                            border: `1px solid ${theme.primaryColor}30`
                          }}
                        >
                          {initials}
                        </div>
                        <div
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
                        >
                          <IndianRupee className="h-3 w-3" />
                          {formatAmount(donor.donate_amount)}
                        </div>
                      </div>

                      {/* Body */}
                      <h3 className="text-[17px] font-bold leading-snug mb-3 line-clamp-2" style={{ color: theme.primaryColor }}>
                        {donor.donator_name}
                      </h3>

                      <div className="space-y-2.5 mt-auto">
                        <div className="flex items-start gap-2.5 text-xs font-medium text-[#475569]">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80 mt-0.5" style={{ color: theme.primaryColor }} />
                          <span className="line-clamp-2 leading-relaxed">{donor.donation_purpose || 'Community support'}</span>
                        </div>
                        {donor.location && (
                          <div className="flex items-center gap-2.5 text-xs font-medium text-[#475569]">
                            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: theme.primaryColor }} />
                            <span className="truncate">{donor.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Load More Button */}
            {!isDonorsPage && donors.length > 4 && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/donors')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                  style={{
                    backgroundColor: theme.buttonColor || theme.primaryColor || '#0a2342',
                    color: theme.fontColor || '#FFFFFF',
                  }}
                >
                  <span>View All Donors ({donors.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
