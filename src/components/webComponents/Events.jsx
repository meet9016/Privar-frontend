import React, { useEffect, useState } from 'react'
import { ArrowRight, Calendar, CheckCircle, Clock, MapPin, Users, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { memberApi } from '../../lib/api'

const formatEventDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const getDatePart = (value, part) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return part === 'day' ? '--' : ''
  if (part === 'day') return date.toLocaleDateString('en-IN', { day: '2-digit' })
  return date.toLocaleDateString('en-IN', { month: 'short' })
}

const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

const normalizeEvent = (event, index) => ({
  _id: event._id || event.id || '',   // add this line
  title: event.event_name || event.title || 'Community Event',
  subtitle: event.title || event.event_name || 'Upcoming Event',
  category: event.event_category_name || 'Community Event',
  location: event.event_location || 'Parivar',
  time: [formatTimeOnly(event.start_time), formatTimeOnly(event.end_time)].filter(Boolean).join(' - ') || 'Time will be announced',
  date: formatEventDate(event.start_time),
  day: getDatePart(event.start_time, 'day'),
  month: getDatePart(event.start_time, 'month'),
  entry: event.entry_type || 'Free',
  attendees: 0,
  image: event.image || `/${(index % 4) + 1}.png`,
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

export default function Events() {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const isEventsPage = location?.pathname === '/events'
  const visibleEvents = isEventsPage ? events : events.slice(0, 4)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    members: '1',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/events?status=1')

        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows.filter(r => r.status === undefined || r.status === null || Number(r.status) === 1 || String(r.status).toLowerCase() === 'active' || String(r.status).toLowerCase() === 'approved')
        setEvents(activeRows.map(normalizeEvent))
      } catch (error) {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    if (!selectedEvent) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') setSelectedEvent(null)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedEvent])

  const openRegisterDialog = (event) => {
    setSelectedEvent(event)
    setFormData({ name: '', email: '', phone: '', members: '1' })
    setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await memberApi.post('/event-registrations', {
        name: formData.name,
        email: formData.email,
        number: formData.phone,
        total_attendee: Number(formData.members),
        event_id: selectedEvent._id,
        entry_type: selectedEvent.entry,
      })
      setSelectedEvent(null)
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      id="events"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-4 relative">
        

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-sm"
              style={{
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
              <span>Upcoming</span>
            </div>

            {/* Heading */}
            <h2
              className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight"
              style={{ color: theme.textColor }}
            >
              Moments Worth Celebrating
            </h2>
          </div>
        </div>

        {/* Custom Keyframe for Section-Wide Bottom-to-Top Slide Reveal */}
        <style>{`
          @keyframes sectionSlideUp {
            0% {
              opacity: 0;
              transform: translateY(65px);
            }
            100% {
              opacity: 1;
              transform: translateY(0px);
            }
          }
        `}</style>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(4).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-tl-[36px] rounded-br-[36px] rounded-tr-xl rounded-bl-xl border border-gray-100 p-4 flex flex-col shadow-sm animate-pulse min-h-[360px]">
                <div className="w-full h-48 sm:h-52 bg-gray-200 rounded-tl-[28px] rounded-br-[28px] mb-3.5" />
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              style={{
                animation: 'sectionSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {visibleEvents.map((event, index) => (
                <article
                  key={event._id || event.title || index}
                  className="group relative flex flex-col overflow-hidden rounded-tl-[36px] rounded-br-[36px] rounded-tr-xl rounded-bl-xl bg-white border shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 p-4 min-h-[360px]"
                  style={{
                    borderColor: `${theme.primaryColor || '#0a2342'}20`,
                  }}
                >
                  {/* Asymmetric Photo Stage */}
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-tl-[28px] rounded-br-[28px] rounded-tr-lg rounded-bl-lg bg-gray-900 mb-3.5">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-112 group-hover:rotate-1"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

                    {/* Top-Left Floating Date Capsule */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1.5 shadow-md border border-white/50">
                      <span className="text-sm font-black leading-none" style={{ color: theme.primaryColor || '#0a2342' }}>{event.day}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.primaryColor || '#0a2342' }}>{event.month}</span>
                    </div>

                    {/* Floating Category Pill */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white shadow-md backdrop-blur-md bg-black/50 border border-white/30 truncate max-w-[140px]">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 flex flex-col justify-between pt-1">
                    <div>
                      <h4 className="text-base font-extrabold leading-snug mb-2 line-clamp-2" style={{ color: theme.textColor || theme.primaryColor || '#0a2342' }}>
                        {event.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500 mb-3">
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primaryColor || '#0a2342' }} />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0 shrink-0">
                          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primaryColor || '#0a2342' }} />
                          <span>{event.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Bar */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="text-xs font-bold text-gray-400">
                        Entry: <strong style={{ color: theme.primaryColor || '#0a2342' }}>{event.entry}</strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => openRegisterDialog(event)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold text-white transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden shrink-0"
                        style={{
                          backgroundColor: theme.buttonColor || theme.primaryColor || '#0a2342',
                          color: theme.fontColor || '#FFFFFF',
                        }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Register Now</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* View All Events Button */}
            {!isEventsPage && events.length > 4 && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/events')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                  style={{
                    backgroundColor: theme.buttonColor || theme.primaryColor || '#0a2342',
                    color: theme.fontColor || '#FFFFFF',
                  }}
                >
                  <span>View All Events ({events.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-register-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedEvent(null)
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border bg-white shadow-2xl"
            style={{ borderColor: theme.borderColor }}
          >
            <div
              className="flex items-start justify-between gap-4 px-6 py-5"
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
                color: theme.fontColor,
              }}
            >
              <div>
                <p className="text-sm font-semibold opacity-90">Event Registration</p>
                <h3 id="event-register-title" className="mt-1 text-xl font-semibold leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-md p-1.5 transition-colors hover:bg-white/15"
                aria-label="Close registration dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <label className="block">
                <span className="text-sm font-semibold" style={{ color: theme.textColor }}>Full Name</span>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: theme.borderColor, color: theme.textColor }}
                  placeholder="Enter your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold" style={{ color: theme.textColor }}>Phone Number</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: theme.borderColor, color: theme.textColor }}
                  placeholder="Enter phone number"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold" style={{ color: theme.textColor }}>Email</span>
                <input
                  type="tel"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: theme.borderColor, color: theme.textColor }}
                  placeholder="Enter email number"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold" style={{ color: theme.textColor }}>Total Members</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.members}
                  onChange={(event) => setFormData({ ...formData, members: event.target.value })}
                  className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: theme.borderColor, color: theme.textColor }}
                />
              </label>



              {submitError && (
                <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-md px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{
                  backgroundColor: theme.buttonColor || theme.primaryColor,
                  color: theme.fontColor,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
