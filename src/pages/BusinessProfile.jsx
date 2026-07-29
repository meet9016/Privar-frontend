import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  Building2,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Youtube
} from 'lucide-react'
import api, { assetUrl } from '../lib/api'

const normalizeValue = (value, fallback = 'Not provided') => {
  if (value === undefined || value === null || value === '') return fallback
  return String(value).replace(/^\[([^\]]+)\]\([^)]+\)$/, '$1')
}
const toExternalHref = (value) => {
  const text = normalizeValue(value, '')
  if (!text) return ''
  if (/^https?:\/\//i.test(text)) return text
  return `https://${text}`
}
const toMailHref = (value) => {
  const text = normalizeValue(value, '')
  const markdownMail = String(value || '').match(/\]\(mailto:([^)]+)\)/i)
  return markdownMail?.[1] ? `mailto:${markdownMail[1]}` : text ? `mailto:${text}` : ''
}

const DetailCard = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4 shadow-glass-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-secondary">{label}</p>
        <p className="mt-1 break-words text-sm font-medium leading-6 text-text [overflow-wrap:anywhere]">{normalizeValue(value)}</p>
      </div>
    </div>
  </div>
)

const Section = ({ title, children }) => (
  <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-5 shadow-glass-sm sm:p-6">
    <h2 className="text-base font-semibold text-text sm:text-lg">{title}</h2>
    <div className="mt-4 min-w-0">{children}</div>
  </section>
)

const SocialButton = ({ href, icon: Icon, label }) => {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </a>
  )
}

export default function BusinessProfile() {
  const { id } = useParams()
  const location = useLocation()
  const [business, setBusiness] = useState(location.state?.business || null)
  const [loading, setLoading] = useState(!location.state?.business)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const fetchBusiness = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/businesses/${id}`)
        const data = res.data?.data || res.data
        if (mounted) setBusiness(data)
      } catch (err) {
        if (mounted) setError('Unable to load this business profile.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchBusiness()
    return () => { mounted = false }
  }, [id])

  const category = normalizeValue(business?.business_category_name, 'Community Enterprise')
  const galleryImages = useMemo(() => {
    const images = business?.gallery_images || []
    return images.filter(Boolean)
  }, [business?.gallery_images])

  const contactItems = [
    { icon: Phone, label: 'Phone', value: business?.number },
    { icon: MessageCircle, label: 'WhatsApp', value: business?.whatsapp_number },
    { icon: Mail, label: 'Email', value: normalizeValue(business?.email) },
    { icon: Globe, label: 'Website', value: business?.website },
    { icon: MapPin, label: 'Address', value: business?.address }
  ]

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: toExternalHref(business?.facebook) },
    { icon: Instagram, label: 'Instagram', href: toExternalHref(business?.instagram) },
    { icon: Youtube, label: 'Youtube', href: toExternalHref(business?.youtube) },
    { icon: Globe, label: 'Pinterest', href: toExternalHref(business?.pinterest) },
    { icon: Globe, label: 'Website', href: toExternalHref(business?.website) }
  ].filter((item) => item.href)

  if (loading && !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-text-secondary">
        <div className="rounded-lg border border-border bg-card p-8 shadow-glass-sm">
          Loading business profile...
        </div>
      </div>
    )
  }

  if (error && !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="rounded-lg border border-border bg-card p-8 shadow-glass-sm">
          <p className="text-sm font-medium text-error">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-24 text-text md:pb-10">
      <main className="mx-auto max-w-6xl space-y-6 px-0 py-0 sm:px-4 sm:py-6">

        {/* Hero */}
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-glass-sm">
          <div className="relative aspect-video w-full overflow-hidden bg-surface">
            {galleryImages?.[0] ? (
              <img
                src={assetUrl(galleryImages?.[0])}
                alt={`${normalizeValue(business.business_name, 'Business')} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-secondary">
                <Building2 className="h-16 w-16" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="relative px-5 pb-6 pt-16 sm:px-8 sm:pb-8">
            <div className="absolute -top-12 left-5 h-24 w-24 overflow-hidden rounded-full border-4 border-card bg-surface shadow-glass-sm sm:left-8">
              {business?.image ? (
                <img
                  src={assetUrl(business.image)}
                  alt={normalizeValue(business.business_name, 'Business logo')}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-secondary">
                  <Building2 className="h-9 w-9" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-text-secondary">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {category}
                </div>
                <h1 className="mt-3 break-words text-3xl font-semibold tracking-normal text-text [overflow-wrap:anywhere] sm:text-4xl">
                  {normalizeValue(business?.business_name, 'Business Profile')}
                </h1>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contactItems.map((item) => (
            <DetailCard key={item.label} {...item} />
          ))}
        </section>

        {/* About */}
        <Section title="About Us">
          <p className="max-w-full break-words text-sm leading-7 text-text-secondary [overflow-wrap:anywhere] sm:text-base">
            {normalizeValue(business?.about_us, 'No business description provided.')}
          </p>
        </Section>

        {/* Business Details */}
        <Section title="Business Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailCard icon={Receipt} label="GST Number" value={business?.GST_number} />
            <DetailCard icon={MapPin} label="Country" value={business?.country || business?.country_name || business?.country_id} />
            <DetailCard icon={Landmark} label="State" value={business?.state || business?.state_name || business?.state_id} />
            <DetailCard icon={Landmark} label="City" value={business?.city || business?.city_name || business?.city_id} />
          </div>
        </Section>

        {/* Location */}
        <Section title="Business Location">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-secondary">Location Link</p>
                <p className="mt-1 break-words text-sm font-medium text-text">{normalizeValue(business?.location_link)}</p>
              </div>
            </div>
            <a 
              href={toExternalHref(business?.location_link) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open Location
            </a>
          </div>
        </Section>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <Section title="Image Gallery">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image, index) => (
                <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface">
                  <img
                    src={assetUrl(image)}
                    alt={`${normalizeValue(business?.business_name, 'Business')} gallery ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Social */}
        {socialLinks.length > 0 && (
          <Section title="Social Media">
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <SocialButton key={item.label} {...item} />
              ))}
            </div>
          </Section>
        )}

      </main>

      {/* Mobile Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-4 py-3 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
          <a href={`tel:${normalizeValue(business?.number, '')}`} className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface px-2 py-2 text-sm font-semibold text-primary">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </a>
          <a href={toExternalHref(business?.whatsapp_number) || '#'} className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface px-2 py-2 text-sm font-semibold text-primary">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
          <a href={toMailHref(business?.email) || '#'} className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface px-2 py-2 text-sm font-semibold text-primary">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        </div>
      </div>
    </div>
  )
}