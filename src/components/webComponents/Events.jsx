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

const normalizeEvent = (event, index) => ({
  _id: event._id || event.id || '',   // add this line
  title: event.event_name || event.title || 'Community Event',
  subtitle: event.title || event.event_name || 'Upcoming Event',
  category: event.event_category_name || 'Community Event',
  location: event.event_location || 'Parivar',
  time: [event.start_time, event.end_time].filter(Boolean).join(' - ') || 'Time will be announced',
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
    email:'',
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
        const response = await memberApi.get('/events')

        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const normalizedEvents = normalizeEvent

        setEvents(rows.map(normalizeEvent))
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
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p
            className="text-sm sm:text-base font-semibold tracking-wide mb-2"
            style={{ color: theme.primaryColor }}
          >
            - Upcoming Events -
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: theme.textColor }}
          >
            Moments Worth{' '}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Celebrating
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
              backgroundColor: shadeColor(theme.backgroundColor, 2),
              color: theme.textColor,
            }}
          >
            Loading events...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event) => (
            <article
              key={event.title}
              className="overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: theme.borderColor }}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute left-4 top-4 rounded-md bg-white px-3 py-2 text-center shadow-lg">
                  <div className="text-xl font-semibold leading-none" style={{ color: theme.textColor }}>
                    {event.day}
                  </div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: theme.primaryColor }}>
                    {event.month}
                  </div>
                </div>
                <div
                  className="absolute right-4 top-4 rounded-full px-3 py-1.5 text-sm font-semibold "
                  style={{
                    backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
                    color: theme.fontColor,
                  }}
                >
                  Registering
                </div>
                <h3 className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
                  {event.subtitle}
                </h3>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: shadeColor(theme.backgroundColor, 2),
                      color: theme.primaryColor,
                    }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {event.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm" style={{ color: theme.textColor }}>
                    <Users className="h-3.5 w-3.5" />
                    {event.attendees}
                  </span>
                </div>

                <h4 className="min-h-12 text-base font-semibold leading-snug" style={{ color: theme.textColor }}>
                  {event.title}
                </h4>

                <div className="mt-4 space-y-2.5 text-sm" style={{ color: shadeColor(theme.textColor, 25) }}>
                  <div className="flex items-center gap-2 border-b border-dashed pb-2" style={{ borderColor: theme.borderColor }}>
                    <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-dashed pb-2" style={{ borderColor: theme.borderColor }}>
                    <Clock className="h-4 w-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <span>{event.date}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => openRegisterDialog(event)}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-lg"
                    style={{
                      backgroundColor: theme.buttonColor || theme.primaryColor,
                      color: theme.fontColor,
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Register Now
                  </button>
                  <div className="text-sm" style={{ color: theme.textColor }}>
                    Entry: <span className="font-semibold">{event.entry}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
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
