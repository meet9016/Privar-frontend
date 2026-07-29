  import React, { useEffect, useMemo, useState } from 'react'
import { HeartHandshake, IndianRupee, MapPin, Sparkles } from 'lucide-react'
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
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        const response = await memberApi.get('/donations')
        setDonors(Array.isArray(response.data?.data) ? response.data.data : [])
      } catch (err) {
        setError('Unable to load donors right now')
        setDonors([])
      } finally {
        setLoading(false)
      }
    }

    fetchDonors()
  }, [])

  const visibleDonors = donors.length > 0 ? donors : []
  const totalAmount = useMemo(
    () => donors.reduce((sum, donor) => sum + Number(donor.donate_amount || 0), 0),
    [donors]
  )

  return (
    <section
      id="donors"
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p
            className="text-sm sm:text-base font-semibold tracking-wide mb-2"
            style={{ color: theme.primaryColor }}
          >
            - Donors -
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: theme.textColor }}
          >
            Our Generous{' '}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Supporters   
        
            </span>
          </h2>
          <div
            className="w-12 h-1 rounded-full mx-auto mt-4"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
            }}
          />
        </div>


        {(loading || error) && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-center text-sm font-semibold"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: shadeColor(theme.backgroundColor, 2),
              color: theme.textColor,
            }}
          >
            {loading ? 'Loading donors...' : error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleDonors.map((donor) => (
            <article
              key={donor.id}
              className="rounded-lg border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: theme.borderColor }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
                    color: theme.fontColor,
                  }}
                >
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
                    {donor.donator_name}
                  </h3>
                  <p className="mt-1 flex items-center text-xl font-semibold" style={{ color: theme.primaryColor }}>
                    <IndianRupee className="h-5 w-5" />
                    {formatAmount(donor.donate_amount)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm" style={{ color: shadeColor(theme.textColor, 25) }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                  <span>{donor.donation_purpose || 'Community support'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                  <span>{donor.location || ''}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
