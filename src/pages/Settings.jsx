import React, { useEffect, useRef, useState } from 'react'
import {
  Settings, Save, Sparkles, RefreshCw, Info,
  Upload, X, Globe, Smartphone, Star,
  Image as ImageIcon, Mail, Phone,
  Facebook, Twitter, Instagram, Youtube, MessageCircle, Building2
} from 'lucide-react'
import api, { assetUrl } from '../lib/api'
import Loader from '../components/common/Loader'
import { toast } from '../lib/toast'
import { AuthContext } from '../context/AuthContext'
import { confirm } from '../lib/confirm'

const DEFAULT_COLORS = {
  primaryColor: '#E65100',
  secondaryColor: '#F4C95D',
  backgroundColor: '#FFF8F0',
  textColor: '#4E342E',
  buttonColor: '#E65100',
  fontColor: '#FFFFFF',
  borderColor: '#E8D9C8',
  gradientStart: '#E65100',
  gradientEnd: '#7B0D1C',
}

const DEFAULT_CONFIG = {
  ...DEFAULT_COLORS,
  appLogo: '',
  webLogo: '',
  favicon: '',
  name: '',
  email: '',
  phone: '',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  whatsapp: '',
  bannerImages: [],
}

const WEB_THEME_KEYS = [
  'backgroundColor',
  'borderColor',
  'buttonColor',
  'fontColor',
  'gradientEnd',
  'gradientStart',
  'primaryColor',
  'secondaryColor',
  'textColor',
  'name',
  'webLogo',
  'favicon',
  'phone',
  'email',
  'facebook',
  'twitter',
  'instagram',
  'youtube',
  'whatsapp'
]

const persistWebThemeToLocalStorage = (theme) => {
  WEB_THEME_KEYS.forEach((key) => {
    const value = theme[key]
    const storageKey = `web_${key}`

    if (value === undefined || value === null || value === '') {
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, value)
    }
  })
}

// ─── Image Upload Field ───────────────────────────────────────────────────────
const ImageUploadField = ({ label, icon: Icon, value, onChange, onDelete, accept = 'image/*', hint }) => {
  const inputRef = useRef()
  const preview = value ? (typeof value === 'string' ? assetUrl(value) : URL.createObjectURL(value)) : null

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold  tracking-wide text-text-secondary flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      <div
        className="relative group flex items-center justify-center border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary bg-surface-secondary"
        style={{ minHeight: 90 }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="max-h-20 max-w-full object-contain p-2" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="absolute top-1.5 right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 py-4 text-text-secondary">
            <Upload className="w-5 h-5" />
            <span className="text-xs">Click to upload</span>
            {hint && <span className="text-xs opacity-60">{hint}</span>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onChange(e.target.files[0]) }}
      />
    </div>
  )
}

// ─── Banner Images ────────────────────────────────────────────────────────────
const BannerImagesField = ({ bannerImages, bannerFiles, onAdd, onDelete }) => {
  const inputRef = useRef()
  const allBanners = [
    ...bannerImages.map(url => ({ type: 'url', value: url })),
    ...bannerFiles.map(file => ({ type: 'file', value: file })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold  tracking-wide text-text-secondary flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" /> Banner Images
      </label>
      <div className="grid grid-cols-3 gap-2">
        {allBanners.map((item, i) => {
          const src = item.type === 'url' ? assetUrl(item.value) : URL.createObjectURL(item.value)
          return (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-surface-secondary aspect-video flex items-center justify-center">
              <img src={src} alt={`banner-${i}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => onDelete(i, item.type)}
                className="absolute top-1 right-1 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        <div
          className="rounded-xl border-2 border-dashed border-border bg-surface-secondary aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 text-text-secondary" />
          <span className="text-xs text-text-secondary mt-1">Add</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { Array.from(e.target.files).forEach(onAdd) }}
      />
    </div>
  )
}

// ─── Color Input ──────────────────────────────────────────────────────────────
const ColorInput = ({ label, value, keyName, desc, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border hover:bg-surface transition-colors text-text">
    <div className="max-w-md">
      <h4 className="text-sm font-semibold text-text  tracking-wide">{label}</h4>
      {desc && <p className="text-sm text-text-secondary mt-1 leading-relaxed">{desc}</p>}
    </div>
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(keyName, e.target.value)}
        className="w-24 bg-input-bg text-text font-mono text-center text-sm py-1.5 border border-border rounded-lg outline-none"
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(keyName, e.target.value)}
        className="w-10 h-8 rounded-lg border-0 bg-transparent outline-none cursor-pointer p-0 shrink-0"
      />
    </div>
  </div>
)

// ─── Text Input ───────────────────────────────────────────────────────────────
const TextInput = ({ label, icon: Icon, value, keyName, placeholder, type = 'text', onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold  tracking-wide text-text-secondary flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(keyName, e.target.value)}
      className="bg-input-bg text-text text-sm py-2 px-3 border border-border rounded-xl outline-none focus:border-primary transition-colors w-full"
    />
  </div>
)

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
    <Icon className="w-4 h-4 text-primary" />
    <h3 className="text-sm font-semibold text-text">{title}</h3>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  // New file objects (not yet uploaded)
  const [logoFiles, setLogoFiles] = useState({ appLogo: null, webLogo: null, favicon: null })
  const [newBannerFiles, setNewBannerFiles] = useState([])
  // Track which existing banner URLs were deleted
  const [deletedBannerUrls, setDeletedBannerUrls] = useState([])

  const [activeTab, setActiveTab] = useState('branding') // branding | theme
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchConfig() }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get('/get_app_theme')
      const data = res.data?.data || res.data || {}
      setConfig({
        primaryColor: data.primaryColor || DEFAULT_COLORS.primaryColor,
        secondaryColor: data.secondaryColor || DEFAULT_COLORS.secondaryColor,
        backgroundColor: data.backgroundColor || DEFAULT_COLORS.backgroundColor,
        textColor: data.textColor || DEFAULT_COLORS.textColor,
        buttonColor: data.buttonColor || DEFAULT_COLORS.buttonColor,
        fontColor: data.fontColor || DEFAULT_COLORS.fontColor,
        borderColor: data.borderColor || DEFAULT_COLORS.borderColor,
        gradientStart: data.gradientStart || DEFAULT_COLORS.gradientStart,
        gradientEnd: data.gradientEnd || DEFAULT_COLORS.gradientEnd,
        appLogo: data.appLogo || '',
        webLogo: data.webLogo || '',
        favicon: data.favicon || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        instagram: data.instagram || '',
        youtube: data.youtube || '',
        whatsapp: data.whatsapp || '',
        bannerImages: Array.isArray(data.bannerImages) ? data.bannerImages : [],
      })
      setLogoFiles({ appLogo: null, webLogo: null, favicon: null })
      setNewBannerFiles([])
      setDeletedBannerUrls([])
    } catch (err) {
      setError('Failed to fetch platform configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  const handleLogoChange = (field, file) => setLogoFiles(prev => ({ ...prev, [field]: file }))

  const handleLogoDelete = (field) => {
    setLogoFiles(prev => ({ ...prev, [field]: null }))
    setConfig(prev => ({ ...prev, [field]: '' }))
  }

  const handleBannerAdd = (file) => setNewBannerFiles(prev => [...prev, file])

  const handleBannerDelete = (index, type) => {
    const urlCount = config.bannerImages.filter((_, i) => !deletedBannerUrls.includes(config.bannerImages[i])).length
    // Rebuild: existing URLs first, then new files
    const existingUrls = config.bannerImages.filter(u => !deletedBannerUrls.includes(u))
    if (type === 'url') {
      const url = existingUrls[index]
      setDeletedBannerUrls(prev => [...prev, url])
    } else {
      const fileIndex = index - existingUrls.length
      setNewBannerFiles(prev => prev.filter((_, i) => i !== fileIndex))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = new FormData()

      // Colors + text fields
      const textFields = ['primaryColor','secondaryColor','backgroundColor','textColor','buttonColor','fontColor','borderColor','gradientStart','gradientEnd','name','email','phone','facebook','twitter','instagram','youtube','whatsapp']
      textFields.forEach(key => payload.append(key, config[key] ?? ''))

      // Logo files or existing URLs
      ;['appLogo', 'webLogo', 'favicon'].forEach(field => {
        if (logoFiles[field]) {
          payload.append(field, logoFiles[field])
        } else {
          payload.append(field, config[field] || '')
        }
      })

      // Existing banner URLs (minus deleted)
      const remainingBanners = config.bannerImages.filter(u => !deletedBannerUrls.includes(u))
      remainingBanners.forEach(url => payload.append('bannerImages', url))

      // New banner files
      newBannerFiles.forEach(file => payload.append('bannerImages', file))

      const updateRes = await api.put('/update_app_theme', payload)
      const updatedTheme = updateRes.data?.data || updateRes.data || config
      persistWebThemeToLocalStorage(updatedTheme)
      window.dispatchEvent(new Event('web-theme-updated'))
      window.dispatchEvent(new Event('storage'))
      toast.success('Platform configuration updated successfully!')
      fetchConfig()
    } catch (err) {
      toast.error('Failed to save configuration settings')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleResetColors = async () => {
    if (!await confirm('Reset color tokens to defaults?', { confirmText: 'Reset', type: 'warning' })) return
    setConfig(prev => ({ ...prev, ...DEFAULT_COLORS }))
  }

  // Compute banner list for display
  const existingBanners = config.bannerImages.filter(u => !deletedBannerUrls.includes(u))

  if (loading) {
      return <div className="py-20"><Loader text="Loading settings..." /></div>
  }

  return (
    <div className="space-y-6 animate-slide-up text-text">

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: 'branding', label: 'Branding & Info', icon: Building2 },
          { key: 'theme', label: 'Theme Colors', icon: Settings },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px
              ${activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── TAB: BRANDING & INFO ─────────────────────────────────────── */}
        {activeTab === 'branding' && (
          <div className="space-y-6">

            {/* Logos */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm space-y-4">
              <SectionHeader icon={Globe} title="Logos & Icons" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ImageUploadField
                  label="App Logo"
                  icon={Smartphone}
                  value={logoFiles.appLogo || config.appLogo}
                  onChange={(f) => handleLogoChange('appLogo', f)}
                  onDelete={() => handleLogoDelete('appLogo')}
                  hint="Mobile app icon"
                />
                <ImageUploadField
                  label="Web Logo"
                  icon={Globe}
                  value={logoFiles.webLogo || config.webLogo}
                  onChange={(f) => handleLogoChange('webLogo', f)}
                  onDelete={() => handleLogoDelete('webLogo')}
                  hint="Header/navbar logo"
                />
                <ImageUploadField
                  label="Favicon"
                  icon={Star}
                  value={logoFiles.favicon || config.favicon}
                  onChange={(f) => handleLogoChange('favicon', f)}
                  onDelete={() => handleLogoDelete('favicon')}
                  hint="Browser tab icon (32×32)"
                />
              </div>
            </div>

            {/* Banner Images */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm">
              <SectionHeader icon={ImageIcon} title="Banner Images" />
              <BannerImagesField
                bannerImages={existingBanners}
                bannerFiles={newBannerFiles}
                onAdd={handleBannerAdd}
                onDelete={handleBannerDelete}
              />
            </div>

            {/* Basic Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm space-y-4">
              <SectionHeader icon={Building2} title="Platform Info" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Platform Name" icon={Building2} keyName="name" value={config.name} placeholder="e.g. Parivar Community" onChange={handleConfigChange} />
                <TextInput label="Contact Email" icon={Mail} keyName="email" value={config.email} placeholder="contact@example.com" type="email" onChange={handleConfigChange} />
                <TextInput label="Phone Number" icon={Phone} keyName="phone" value={config.phone} placeholder="+91 99999 99999" onChange={handleConfigChange} />
                <TextInput label="WhatsApp" icon={MessageCircle} keyName="whatsapp" value={config.whatsapp} placeholder="+91 99999 99999" onChange={handleConfigChange} />
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm space-y-4">
              <SectionHeader icon={Globe} title="Social Links" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput label="Facebook" icon={Facebook} keyName="facebook" value={config.facebook} placeholder="https://facebook.com/page" onChange={handleConfigChange} />
                <TextInput label="Twitter / X" icon={Twitter} keyName="twitter" value={config.twitter} placeholder="https://twitter.com/handle" onChange={handleConfigChange} />
                <TextInput label="Instagram" icon={Instagram} keyName="instagram" value={config.instagram} placeholder="https://instagram.com/page" onChange={handleConfigChange} />
                <TextInput label="YouTube" icon={Youtube} keyName="youtube" value={config.youtube} placeholder="https://youtube.com/channel" onChange={handleConfigChange} />
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saveLoading}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-glow-primary transition-all duration-300"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Saving...' : 'Save Branding'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: THEME COLORS ────────────────────────────────────────── */}
        {activeTab === 'theme' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Color Form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-glass-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> Theme Settings
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetColors}
                    className="flex items-center gap-2 bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Defaults
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-glow-primary transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Primary Highlight Color', key: 'primaryColor' },
                  { label: 'Secondary Accent Color', key: 'secondaryColor' },
                  { label: 'Global Background Canvas', key: 'backgroundColor' },
                  { label: 'Default Base Typography Text', key: 'textColor' },
                  { label: 'Primary Button Color', key: 'buttonColor' },
                  { label: 'Button Label Color', key: 'fontColor' },
                  { label: 'Card Border Color', key: 'borderColor' },
                  { label: 'Gradient Start Token', key: 'gradientStart' },
                  { label: 'Gradient End Token', key: 'gradientEnd' },
                ].map(({ label, key }) => (
                  <ColorInput
                    key={key}
                    label={label}
                    value={config[key]}
                    keyName={key}
                    onChange={handleConfigChange}
                  />
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-text">Live Brand Palette Preview</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Preview represents the layout of the mobile application dashboard using current theme tokens.
                </p>
                <div className="w-full rounded-2xl border-4 border-text overflow-hidden shadow-glass-lg relative" style={{ backgroundColor: config.backgroundColor }}>
                  <div className="h-28 p-4 flex flex-col justify-between relative" style={{ backgroundImage: `linear-gradient(to bottom right, ${config.gradientStart}, ${config.gradientEnd})` }}>
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-2 rounded bg-white/20"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold leading-none">Namaste, Rameshji</h4>
                      <p className="text-white/60 text-sm mt-1 font-semibold">{config.name || 'Parivar Community Hub'}</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-2.5 rounded-xl border flex items-center justify-between text-sm" style={{ borderColor: config.borderColor, backgroundColor: '#ffffff' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }}></span>
                        <span className="font-semibold" style={{ color: config.textColor }}>View Family Directory</span>
                      </div>
                      <span style={{ color: config.textColor }}>→</span>
                    </div>
                    <div className="p-2.5 rounded-xl border flex items-center justify-between text-sm" style={{ borderColor: config.borderColor, backgroundColor: '#ffffff' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config.secondaryColor }}></span>
                        <span className="font-semibold" style={{ color: config.textColor }}>Registered Businesses</span>
                      </div>
                      <span style={{ color: config.textColor }}>→</span>
                    </div>
                    <button className="w-full text-center py-1.5 rounded-lg text-sm font-semibold  tracking-wider" style={{ backgroundColor: config.buttonColor, color: config.fontColor }}>
                      Add Member
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-3.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-secondary leading-relaxed flex gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Theme tokens are synchronized dynamically with both web and mobile environments.</span>
              </div>
            </div>

          </div>
        )}

      </form>
    </div>
  )
}