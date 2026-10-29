import React, { useEffect, useState } from 'react'
import { Building2, Store, MapPin, Phone, Globe, ArrowRight, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

const normalizeBusiness = (biz, index) => {
  const name = biz.business_name || biz.name || `Enterprise ${index + 1}`
  const category = biz.business_category_name || biz.category_name || biz.category || ''
  const location = [biz.city_name, biz.state_name].filter(Boolean).join(', ') || biz.address || ''
  const phone = biz.whatsapp_number || biz.number || ''
  const image = biz.image || biz.logo || ''
  const website = biz.website || ''
  const email = biz.email || ''

  return {
    id: biz.id || `${name}-${index}`,
    name,
    category,
    location,
    phone,
    image,
    website,
    email,
  }
}



export default function Businesses() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true)
        const response = await api.get('/businesses')
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

  const primaryColor = theme.primaryColor || '#991B1B'
  const textColor = theme.textColor || '#0a2342'

  const visibleBusinesses = businesses.length > 0 ? businesses : []

  // Ensure base track has at least 8 items so it fills ultrawide screens
  const repeatCount = visibleBusinesses.length > 0 ? Math.max(2, Math.ceil(8 / visibleBusinesses.length)) : 1
  const baseList = Array(repeatCount).fill(visibleBusinesses).flat()
  // Exact 2x duplication for mathematical 100% seamless infinite loop (-50%)
  const displayBusinesses = [...baseList, ...baseList]
  // Slow, comfortable reading speed (~8.5 seconds per card, ~37px/second)
  const scrollDuration = Math.max(50, baseList.length * 8.5)

  return (
    <section
      id="businesses"
      className="w-full px-4 sm:px-6 lg:px-8 pt-0 pb-12 sm:pb-14 lg:pb-16 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor || 'transparent',
        paddingTop: 0,
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="relative z-10 flex flex-col items-center text-center mb-6 sm:mb-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2.5 px-3.5 py-1.5 rounded-full border shadow-2xs backdrop-blur-sm"
            style={{
              color: primaryColor,
              borderColor: `${primaryColor}25`,
              backgroundColor: `${primaryColor}0a`,
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Community Directory</span>
          </div>

          {/* Heading */}
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-2"
            style={{ color: textColor }}
          >
            Our Community Businesses
          </h2>


        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex gap-[24px] justify-center overflow-hidden px-4 py-3">
            {Array(5).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="relative flex-shrink-0 w-[270px] sm:w-[290px] rounded-[26px] overflow-hidden bg-white border shadow-sm animate-pulse p-3"
                style={{
                  borderColor: `${primaryColor}15`,
                }}
              >
                <div className="w-full h-[175px] rounded-[20px] bg-gray-200 mb-3" />
                <div className="px-1 flex flex-col gap-2.5">
                  <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded-full" />
                  <div className="h-8 w-full bg-gray-100 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleBusinesses.length === 0 ? (
          <div
            className="text-center py-12 px-6 bg-white rounded-3xl border shadow-sm max-w-md mx-auto"
            style={{ borderColor: `${primaryColor}18` }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
            >
              <Store className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">No Businesses Listed Yet</h3>
            <p className="text-xs text-gray-500">Community businesses will appear here once registered.</p>
          </div>
        ) : (
          /* Infinite Scroll Track */
          <div
            className="overflow-hidden relative"
          >
            <div
              style={{
                display: 'flex',
                gap: '24px',
                width: 'max-content',
                padding: '12px 12px 20px',
                animation: `scroll-left ${scrollDuration}s linear infinite`,
                willChange: 'transform',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
              onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
            >
              {displayBusinesses.map((biz, i) => (
                <article
                  key={`${biz.id}-${i}`}
                  className="group relative flex-shrink-0 w-[270px] sm:w-[290px] rounded-[26px] overflow-hidden bg-white border transition-all duration-300 select-none flex flex-col cursor-pointer shadow-sm hover:shadow-xl"
                  style={{
                    borderColor: `${primaryColor}18`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)'
                    e.currentTarget.style.boxShadow = `0 20px 38px -8px ${primaryColor}22, 0 4px 12px rgba(0, 0, 0, 0.04)`
                    e.currentTarget.style.borderColor = `${primaryColor}35`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)'
                    e.currentTarget.style.boxShadow = '0 8px 22px -4px rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.borderColor = `${primaryColor}18`
                  }}
                >
                  {/* Photo Frame (Modern Inset Luxury Card) */}
                  <div className="relative m-3 mb-2 h-[175px] rounded-[20px] bg-slate-900 overflow-hidden shadow-xs">
                    <img
                      src={biz.image || '/image.png'}
                      alt={biz.name}
                      onError={(e) => {
                        e.target.src = '/image.png'
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      draggable={false}
                      loading="lazy"
                    />
                    {/* Dark Vignette Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                    {/* Category Tag on Top Left (Rendered ONCE with real category) */}
                    {biz.category && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/30 shadow-sm"
                          style={{
                            backgroundColor: `${primaryColor}e6`,
                          }}
                        >
                          <Store className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{biz.category}</span>
                        </span>
                      </div>
                    )}


                  </div>

                  {/* Card Body */}
                  <div className="px-4 pb-4 pt-1.5 flex flex-col justify-between flex-1">
                    <div>
                      {/* Business Name */}
                      <h3
                        className="text-base sm:text-[17px] font-black text-gray-900 mb-1.5 leading-snug truncate transition-colors duration-200 group-hover:text-primary"
                        style={{ color: textColor }}
                        title={biz.name}
                      >
                        {biz.name}
                      </h3>

                      {/* Location Row (Unique, Not Duplicated!) */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span className="truncate font-semibold text-gray-600">
                          {biz.location || 'Community Enterprise'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Contact / Phone & Connect Button */}
                    <div
                      className="pt-3 mt-auto border-t flex items-center justify-between gap-2"
                      style={{ borderColor: `${primaryColor}14` }}
                    >
                      {biz.phone ? (
                        <a
                          href={`tel:${biz.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors truncate max-w-[140px]"
                          title={`Call ${biz.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{biz.phone}</span>
                        </a>
                      ) : biz.website ? (
                        <a
                          href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors truncate max-w-[140px]"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">Visit Website</span>
                        </a>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">
                          Verified Member
                        </span>
                      )}

                      <div
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md shrink-0"
                        style={{
                          backgroundColor: primaryColor,
                        }}
                      >
                        <span>Connect</span>
                        <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}