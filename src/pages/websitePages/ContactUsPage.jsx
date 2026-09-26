import React, { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  HeartHandshake
} from 'lucide-react'
import { memberApi, getDomainCommunityName, getCommunityFullName } from '../../lib/api'
import { useWebTheme } from '../../hooks/useWebTheme'
import { toast } from '../../lib/toast'

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
    'phone',
    'email',
    'name',
    'facebook',
    'instagram',
    'twitter',
    'youtube',
    'whatsapp'
  ]
  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

export default function ContactUsPage() {
  useWebTheme()
  const [theme, setTheme] = useState(getStoredWebTheme())

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    subject: '',
    note: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Please enter your full name')
      return
    }

    if (!formData.mobile.trim()) {
      setFormError('Please enter your mobile number')
      return
    }

    // Basic mobile validation (at least 10 digits)
    const cleanMobile = formData.mobile.replace(/\D/g, '')
    if (cleanMobile.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        parivar_name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        note: formData.subject
          ? `[Subject: ${formData.subject.trim()}] ${formData.note.trim()}`
          : formData.note.trim()
      }

      await memberApi.post('/inquiry', payload)
      setSubmitted(true)
      toast.success('Your message has been sent successfully! Our team will contact you shortly.')
      setFormData({
        name: '',
        mobile: '',
        email: '',
        subject: '',
        note: ''
      })
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit inquiry. Please try again.'
      setFormError(errMsg)
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const communityTitle = theme?.name || getCommunityFullName()
  const primaryColor = theme.primaryColor || '#0a2342'
  const secondaryColor = theme.secondaryColor || theme.primaryColor || '#1e3a8a'
  const textColor = theme.textColor || '#111827'
  const buttonColor = theme.buttonColor || primaryColor

  return (
    <div
      className="w-full min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor || '#F8FAFC' }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* ── HEADER BANNER ── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-xs"
            style={{
              color: primaryColor,
              borderColor: `${primaryColor}30`
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Get in Touch</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            style={{ color: textColor }}
          >
            Contact Our Community
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div
              className="rounded-2xl p-7 sm:p-8 text-white shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
              }}
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight">{communityTitle}</h3>
                  <p className="text-xs text-white/80 mt-0.5 font-medium">Community Helpdesk &amp; Support</p>
                </div>
              </div>

              <p className="text-sm text-white/90 leading-relaxed mb-8 font-normal">
                We are dedicated to supporting our members. Feel free to contact us regarding membership, community activities, or general inquiries.
              </p>

              <div className="space-y-4 pt-6 border-t border-white/15">
                {theme?.phone && (
                  <a
                    href={`tel:${theme.phone}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/10 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">Phone Number</span>
                      <span className="text-sm font-bold text-white tracking-wide">{theme.phone}</span>
                    </div>
                  </a>
                )}
                {theme?.email && (
                  <a
                    href={`mailto:${theme.email}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/10 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">Email Address</span>
                      <span className="text-sm font-bold text-white tracking-wide truncate block">{theme.email}</span>
                    </div>
                  </a>
                )}
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-white/10 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">Response Time</span>
                    <span className="text-sm font-bold text-white tracking-wide">Within 24 Hours</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <HeartHandshake className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                Your message is directly shared with authorized committee coordinators for immediate follow-up.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-7 sm:p-9 border border-gray-100 shadow-md">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Send Us a Message
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Please fill in your details below and we will contact you soon.
                </p>
              </div>

              {submitted ? (
                <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-emerald-950">Message Sent Successfully!</h3>
                    <p className="text-sm text-emerald-800 max-w-md mx-auto">
                      Thank you for contacting {communityTitle}. Our representative will get back to you shortly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-sm text-rose-800 font-medium animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Full Name <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rajeshbhai Patel"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                        style={{
                          focusRingColor: primaryColor
                        }}
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>Mobile Number <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>Email <span className="text-gray-400 font-normal lowercase">(optional)</span></span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. name@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span>Subject</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Membership inquiry"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Note / Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      <span>Message / Query</span>
                    </label>
                    <textarea
                      name="note"
                      rows={4}
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Write your message or inquiry details here..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50/50 hover:bg-white focus:bg-white resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                      style={{ backgroundColor: buttonColor }}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending Message...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
