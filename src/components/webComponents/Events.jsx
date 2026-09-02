import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle, Clock, MapPin, Users, X } from 'lucide-react'
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
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
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

  const visibleEvents = events.length > 0 ? events : []



  return (
    <section
      id="events"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 relative">
          {/* Faint Background Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-full text-[5rem] sm:text-[8rem] md:text-[10rem] font-black opacity-[0.02] pointer-events-none tracking-tighter uppercase whitespace-nowrap select-none" style={{ color: theme.primaryColor }}>
            Events
          </div>

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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-lg border border-gray-100 flex flex-col overflow-hidden shadow-sm">
                <div className="w-full h-44 bg-gray-200 animate-pulse" />
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse shrink-0" />
                      <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse shrink-0" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse shrink-0" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-auto pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                    <div className="h-8 w-28 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleEvents.map((event) => (
              <article
                key={event.title}
                className="group flex flex-col overflow-hidden rounded-lg bg-white border shadow-sm transition-all duration-300 hover:shadow-md"
                style={{ borderColor: `${theme.borderColor}40` }}
              >
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 pointer-events-none transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Date Badge */}
                  <div className="absolute top-3 left-3 bg-white rounded-md px-3 py-1.5 flex flex-col items-center justify-center shadow-md">
                    <span className="text-lg font-black leading-none mb-0.5" style={{ color: theme.primaryColor }}>{event.day}</span>
                    <span className="text-[10px] font-bold" style={{ color: theme.primaryColor }}>{event.month}</span>
                  </div>

                  {/* Subtitle */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <h3 className="text-white text-[11px] font-bold leading-snug drop-shadow-md line-clamp-2">
                      <span className="mr-1">✨</span> {event.subtitle}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#334155] bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                      <Users className="h-3 w-3" style={{ color: theme.primaryColor }} />
                      {event.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                      <Users className="h-3.5 w-3.5 opacity-60" />
                      {event.attendees}
                    </span>
                  </div>

                  <h4 className="text-[17px] font-bold leading-snug mb-3 line-clamp-2" style={{ color: theme.primaryColor }}>
                    {event.title}
                  </h4>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#475569]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: theme.primaryColor }} />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#475569]">
                      <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: theme.primaryColor }} />
                      <span className="truncate">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-medium text-[#475569]">
                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: theme.primaryColor }} />
                      <span className="truncate">{event.date}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-dashed" style={{ borderColor: `${theme.borderColor}40` }}>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openRegisterDialog(event)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Register Now
                      </button>
                      <div className="text-xs font-medium text-gray-500">
                        Entry: <strong style={{ color: theme.primaryColor }}>{event.entry}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
