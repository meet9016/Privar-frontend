import React, { useEffect, useState } from 'react'
import { ArrowRight, Calendar, CheckCircle, Clock, MapPin, Users, X, AlertCircle } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { memberApi } from '../../lib/api'
import { toast } from '../../lib/toast'

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
  const [errors, setErrors] = useState({})
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
    setErrors({})
    setSubmitError('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Please enter a valid full name'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.members || Number(formData.members) < 1) {
      newErrors.members = 'Total members must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      await memberApi.post('/event-registrations', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        number: formData.phone.trim(),
        total_attendee: Number(formData.members),
        event_id: selectedEvent._id,
        entry_type: selectedEvent.entry,
      })
      toast.success('Registration submitted successfully!')
      setSelectedEvent(null)
      setFormData({ name: '', email: '', phone: '', members: '1' })
      setErrors({})
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Registration failed. Please try again.'
      setSubmitError(errMsg)
      toast.error(errMsg)
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
        ) : visibleEvents.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-xl mx-auto">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Upcoming Events</h3>
            <p className="text-sm text-gray-500">Check back later for new events and celebrations.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleEvents.map((event, index) => {
                return (
                  <div
                    key={event._id || `event-${index}`}
                    className="group bg-white rounded-tl-[36px] rounded-br-[36px] rounded-tr-xl rounded-bl-xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5"
                    style={{
                      borderColor: '#f1f5f9',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                      animation: `sectionSlideUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.12}s`,
                      opacity: 0,
                    }}
                  >
                    {/* Image / Header Block with curved corners */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-tl-[28px] rounded-br-[28px] m-2" style={{ width: 'calc(100% - 16px)' }}>
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.gradientEnd || theme.primaryColor})`
                          }}
                        >
                          <Calendar className="w-16 h-16 text-white/40" />
                        </div>
                      )}

                      {/* Date Badge */}
                      {event.date && (
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.primaryColor }}>
                          <span className="text-sm leading-none">{getDatePart(event.date, 'day')}</span>
                          <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">{getDatePart(event.date, 'month')}</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {event.category && (
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                          {event.category}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 pt-2 flex flex-col flex-grow">
                      <h3
                        className="text-base font-bold line-clamp-1 mb-2 group-hover:text-primary transition-colors"
                        style={{ color: theme.textColor }}
                      >
                        {event.title}
                      </h3>

                      {/* Meta info: Venue, Time, Members */}
                      <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                        {event.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        {event.time && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{formatTimeOnly(event.time)}</span>
                          </div>
                        )}
                        {event.membersCount !== undefined && event.membersCount !== null && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{event.membersCount} attending</span>
                          </div>
                        )}
                      </div>

                      {/* Action / Entry Footer */}
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          Entry: <span className="text-gray-800 font-bold capitalize">{event.entry || 'Free'}</span>
                        </span>

                        <button
                          onClick={() => openRegisterDialog(event)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 hover:shadow-md hover:scale-105"
                          style={{
                            backgroundColor: theme.buttonColor || theme.primaryColor,
                            color: theme.fontColor || '#FFFFFF',
                          }}
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* View More Button (Homepage only) */}
            {!isEventsPage && events.length > 4 && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => navigate('/events')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 hover:shadow-md"
                  style={{
                    color: theme.primaryColor,
                    borderColor: theme.primaryColor,
                    backgroundColor: 'transparent',
                  }}
                >
                  <span>View All Events</span>
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
            className="w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-2xl transition-all"
            style={{ borderColor: theme.borderColor }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-4 px-6 py-5"
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
                color: theme.fontColor,
              }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Event Registration</p>
                <h3 id="event-register-title" className="mt-1 text-lg font-bold leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/20 text-white"
                aria-label="Close registration dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${
                    errors.name
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(event) => {
                    const onlyNums = event.target.value.replace(/\D/g, '')
                    handleChange('phone', onlyNums)
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${
                    errors.phone
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${
                    errors.email
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Total Members */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Total Members <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.members}
                  onChange={(event) => handleChange('members', event.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all ${
                    errors.members
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20'
                      : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/15'
                  }`}
                  placeholder="1"
                />
                {errors.members && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.members}</p>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-95 disabled:opacity-60 shadow-sm"
                  style={{
                    backgroundColor: theme.buttonColor || theme.primaryColor,
                    color: theme.fontColor || '#FFFFFF',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
