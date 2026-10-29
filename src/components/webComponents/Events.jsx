import React, { useEffect, useState } from 'react'
import { ArrowRight, Calendar, CheckCircle, Clock, MapPin, Users, X, AlertCircle, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

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
  if (!value) {
    if (part === 'day') return '01'
    if (part === 'month') return 'Jan'
    if (part === 'year') return new Date().getFullYear().toString()
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    if (part === 'day') return '01'
    if (part === 'month') return 'Jan'
    if (part === 'year') return new Date().getFullYear().toString()
    return ''
  }
  if (part === 'day') return date.toLocaleDateString('en-IN', { day: '2-digit' })
  if (part === 'month') return date.toLocaleDateString('en-IN', { month: 'short' })
  if (part === 'year') return date.toLocaleDateString('en-IN', { year: 'numeric' })
  return ''
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

const normalizeEvent = (event, index) => {
  const startDate = event.start_time || event.date || event.event_date
  return {
    _id: event._id || event.id || '',
    title: event.event_name || event.title || 'Community Event',
    subtitle: event.title || event.event_name || 'Upcoming Event',
    description: event.description || event.event_description || '',
    category: event.event_category_name || event.category || 'Celebration',
    location: event.event_location || event.venue || event.location || '',
    venue: event.event_location || event.venue || event.location || '',
    time: [formatTimeOnly(event.start_time), formatTimeOnly(event.end_time)].filter(Boolean).join(' - ') || (event.time ? String(event.time) : ''),
    date: formatEventDate(startDate),
    day: getDatePart(startDate, 'day'),
    month: getDatePart(startDate, 'month'),
    year: getDatePart(startDate, 'year'),
    entry: event.entry_type || event.entry || 'Free',
    membersCount: event.membersCount || 0,
    attendees: event.membersCount || 0,
    image: event.image || event.event_image || `/${(index % 4) + 1}.png`,
  }
}

export default function Events() {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const primaryColor = theme.primaryColor || '#991B1B'
  const isEventsPage = location?.pathname === '/events'
  const visibleEvents = isEventsPage ? events : events.slice(0, 8)
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
    window.addEventListener('web-theme-updated', loadTheme)
    return () => {
      window.removeEventListener('storage', loadTheme)
      window.removeEventListener('web-theme-updated', loadTheme)
    }
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await api.get('/events?status=1')

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
      await api.post('/event-registrations', {
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
      className="w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-5 pb-12 sm:pb-14 lg:pb-16 relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        paddingTop: '20px',
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-7 relative">


          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2.5 sm:mb-3 px-4 py-1.5 rounded-full border bg-white shadow-sm"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={`skeleton-card-${i}`}
                className="bg-white rounded-2xl sm:rounded-3xl border animate-pulse flex flex-col justify-between overflow-hidden"
                style={{ borderColor: theme.borderColor || '#EAEAEA' }}
              >
                <div className="bg-gray-100 p-2 sm:p-2.5 flex items-stretch gap-2.5 w-full">
                  <div className="w-[64px] sm:w-[70px] h-28 sm:h-32 bg-gray-200 rounded-xl sm:rounded-2xl flex-shrink-0" />
                  <div className="flex-1 h-28 sm:h-32 bg-gray-200 rounded-xl sm:rounded-2xl" />
                </div>
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="space-y-1.5 py-1">
                    <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                    <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded-xl w-28 mt-2" />
                </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleEvents.map((event, index) => (
              <div
                key={event._id || `event-${index}`}
                className="bg-white rounded-2xl sm:rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                style={{
                  borderColor: theme.borderColor || '#EAEAEA',
                }}
              >
                {/* Top Banner (Date Badge + Event Image - flush to card edges to utilize full space) */}
                <div
                  className="relative p-2 sm:p-2.5 flex items-stretch gap-2 sm:gap-2.5 overflow-hidden w-full"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}14 0%, ${primaryColor}04 100%)`,
                  }}
                >
                  {/* Date Badge */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100/80 px-2.5 py-2.5 sm:px-3 sm:py-3 flex flex-col items-center justify-center text-center min-w-[64px] sm:min-w-[70px] flex-shrink-0">
                    <span
                      className="text-xl sm:text-2xl font-black leading-none mb-0.5 tracking-tight"
                      style={{ color: primaryColor }}
                    >
                      {event.day}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 leading-tight mb-0.5">
                      {event.month}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 leading-tight">
                      {event.year}
                    </span>
                  </div>

                  {/* Event Image */}
                  <div className="relative flex-1 h-28 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={event.image}
                      alt={event.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = `/${(index % 4) + 1}.png`
                      }}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 p-3.5 sm:p-4 pt-3">
                  {/* Event Title */}
                  <h3
                    className="text-sm sm:text-base font-bold tracking-tight text-[#0D1527] line-clamp-1 mb-2.5 group-hover:text-primary transition-colors"
                    style={{ color: theme.textColor || '#0D1527' }}
                  >
                    {event.title}
                  </h3>

                  {/* Location & Time Rows */}
                  <div className="space-y-1.5 mb-3.5 sm:mb-4">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                        }}
                      >
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="truncate">{event.venue || event.location || 'Community Hall'}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                        }}
                      >
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="truncate">{event.time || '6:00 PM - 10:00 PM'}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="mt-auto pt-1">
                    <button
                      type="button"
                      onClick={() => openRegisterDialog(event)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-4.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      style={{
                        backgroundColor: theme.buttonColor || theme.primaryColor || '#991B1B',
                        color: theme.fontColor || '#FFFFFF',
                      }}
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Events Button (Centered at bottom, homepage only) */}
        {!isEventsPage && events.length > 8 && (
          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer"
              style={{
                color: primaryColor,
                borderColor: primaryColor,
                backgroundColor: 'transparent',
              }}
            >
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${errors.name
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
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${errors.phone
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
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${errors.email
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
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all ${errors.members
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
