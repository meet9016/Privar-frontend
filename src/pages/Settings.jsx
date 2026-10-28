import React, { useEffect, useRef, useState } from 'react'
import {
  Settings, Save, Sparkles, RefreshCw, Info,
  Upload, X, Globe, Smartphone, Star,
  Image as ImageIcon, Mail, Phone,
  Facebook, Twitter, Instagram, Youtube, MessageCircle, Building2,
  Apple, Play, Bell, Clock, Calendar, Send,
  Moon, Sun, Sunrise, Sunset, Download, Share2,
  Megaphone, Users, Compass, Eye
} from 'lucide-react'
import mosqueBannerBg from '../assets/prayer/mosqueBannerBg.jpg'
import api, { assetUrl, getSubdomainTenant } from '../lib/api'
import Loader from '../components/common/Loader'
import { toast } from '../lib/toast'
import { AuthContext } from '../context/AuthContext'
import { confirm } from '../lib/confirm'

import { compressImage } from '../lib/imageCompressor'
import NamazTimetableCard from '../components/NamazTimetableCard'
import Select from '../components/common/Select'

const DEFAULT_COLORS = {
  primaryColor: '#1565C0',
  secondaryColor: '#42A5F5',
  backgroundColor: '#F7FAFD',
  textColor: '#172B4D',
  buttonColor: '#1976D2',
  fontColor: '#FFFFFF',
  borderColor: '#D9E7F5',
  gradientStart: '#2196F3',
  gradientEnd: '#0D47A1',
}

const to24Hour = (timeStr) => {
  if (!timeStr) return '09:00';
  const trimmed = String(timeStr).trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const to12Hour = (timeStr) => {
  if (!timeStr) return '09:00 AM';
  const trimmed = String(timeStr).trim();
  if (/am|pm/i.test(trimmed)) return trimmed.toUpperCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12; // 00:00 becomes 12:00 AM
  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
};

const TimePicker12Hour = ({ value, onChange, themeColor = 'primary' }) => {
  const parseVal = (str) => {
    let hours = '09';
    let minutes = '00';
    let period = 'AM';

    if (str) {
      const trimmed = String(str).trim();
      const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match) {
        let h = parseInt(match[1], 10);
        minutes = match[2];
        const p = match[3]?.toUpperCase();

        if (p) {
          hours = String(h === 0 ? 12 : h > 12 ? h - 12 : h).padStart(2, '0');
          period = p;
        } else {
          period = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          hours = String(h).padStart(2, '0');
        }
      }
    }
    return { hours, minutes, period };
  };

  const { hours, minutes, period } = parseVal(value);

  const update = (newH, newM, newP) => {
    const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')} ${newP}`;
    onChange(formatted);
  };

  const hourOptions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const allMinutes = minuteOptions;

  const isEmerald = themeColor === 'emerald';

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
      <div className="relative shrink-0">
        <select
          value={hours}
          onChange={(e) => update(e.target.value, minutes, period)}
          className={`bg-input-bg text-text text-xs sm:text-sm font-bold py-1.5 pl-2 sm:pl-2.5 pr-5 sm:pr-6 border rounded-xl outline-none cursor-pointer appearance-none ${
            isEmerald 
              ? 'border-border focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600' 
              : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
          }`}
          title="Select Hour (1 to 12)"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h} className="bg-surface text-text">
              {h}
            </option>
          ))}
        </select>
        <span className="absolute right-1.5 top-2.5 pointer-events-none text-text-secondary text-[9px]">▼</span>
      </div>

      <span className="text-text font-black text-xs sm:text-sm select-none">:</span>
      <div className="relative shrink-0">
        <select
          value={minutes}
          onChange={(e) => update(hours, e.target.value, period)}
          className={`bg-input-bg text-text text-xs sm:text-sm font-bold py-1.5 pl-2 sm:pl-2.5 pr-5 sm:pr-6 border rounded-xl outline-none cursor-pointer appearance-none ${
            isEmerald 
              ? 'border-border focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600' 
              : 'border-border focus:border-primary focus:ring-1 focus:ring-primary'
          }`}
          title="Select Minutes"
        >
          {allMinutes.map((m) => (
            <option key={m} value={m} className="bg-surface text-text">
              {m}
            </option>
          ))}
        </select>
        <span className="absolute right-1.5 top-2.5 pointer-events-none text-text-secondary text-[9px]">▼</span>
      </div>
      <div className="inline-flex rounded-xl p-0.5 bg-surface-secondary border border-border shadow-xs shrink-0">
        <button
          type="button"
          onClick={() => update(hours, minutes, 'AM')}
          className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
            period === 'AM'
              ? isEmerald
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => update(hours, minutes, 'PM')}
          className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
            period === 'PM'
              ? isEmerald
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-primary text-white shadow-xs'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
};

const MosqueIcon = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Central Dome */}
    <path d="M16 4C14.5 7 11.5 9 11.5 13C11.5 14.2 12.1 15.2 13 16H19C19.9 15.2 20.5 14.2 20.5 13C20.5 9 17.5 7 16 4Z" fill="currentColor" />
    <path d="M16 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="16" cy="2" r="0.8" fill="currentColor" />
    {/* Base structure */}
    <rect x="7" y="15.5" width="18" height="12.5" rx="1" fill="currentColor" />
    {/* Main Middle Arch */}
    <path d="M13.5 28V22C13.5 20.6 14.6 19.5 16 19.5C17.4 19.5 18.5 20.6 18.5 22V28H13.5Z" fill="#E8F8F0" />
    {/* Left Arch */}
    <path d="M8.5 28V23.5C8.5 22.4 9.2 21.5 10.2 21.5C11.2 21.5 12 22.4 12 23.5V28H8.5Z" fill="#E8F8F0" />
    {/* Right Arch */}
    <path d="M20 28V23.5C20 22.4 20.8 21.5 21.8 21.5C22.8 21.5 23.5 22.4 23.5 23.5V28H20Z" fill="#E8F8F0" />
    {/* Left Pillar Dome */}
    <path d="M5 16L6.5 18V28H4.5V18L5 16Z" fill="currentColor" />
    {/* Right Pillar Dome */}
    <path d="M27 16L28.5 18V28H26.5V18L27 16Z" fill="currentColor" />
  </svg>
);

const PrayerTimeInput = ({ value, onChange, placeholder = "05:00", defaultPeriod = "AM", className = "" }) => {
  const raw = String(value || '').trim();
  const hasPM = /PM/i.test(raw);
  const hasAM = /AM/i.test(raw);
  const currentPeriod = hasPM ? 'PM' : (hasAM ? 'AM' : defaultPeriod);
  const timePart = raw.replace(/\s*(AM|PM)/gi, '').trim();

  const handleTimeChange = (e) => {
    let val = e.target.value.trim();
    if (!val) {
      onChange('');
      return;
    }
    const inlineMatch = val.match(/^(\d{1,2}:\d{2})\s*(AM|PM)?$/i);
    if (inlineMatch && inlineMatch[2]) {
      onChange(`${inlineMatch[1]} ${inlineMatch[2].toUpperCase()}`);
    } else {
      onChange(`${val} ${currentPeriod}`);
    }
  };
  const handlePeriodSelect = (period) => {
    const t = timePart || placeholder;
    onChange(`${t} ${period}`);
  };
  return (
    <div className={`inline-flex items-center justify-between gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-surface border border-slate-200/90 dark:border-border hover:border-emerald-500/60 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 shadow-2xs transition-all ${className}`}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-text-muted shrink-0 hidden min-[360px]:inline-block" />
        <input
          type="text"
          value={timePart}
          placeholder={placeholder}
          onChange={handleTimeChange}
          inputMode="numeric"
          className="w-full min-w-0 bg-transparent text-slate-800 dark:text-text font-bold text-center text-xs sm:text-[13px] outline-none tracking-tight placeholder:text-slate-300 dark:placeholder:text-text-muted/40"
        />
      </div>
      <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-surface-secondary shrink-0">
        <button
          type="button"
          onClick={() => handlePeriodSelect('AM')}
          className={`px-1.5 sm:px-2 py-0.5 font-bold rounded-md text-[9px] sm:text-[10px] transition-all cursor-pointer ${
            currentPeriod === 'AM'
              ? 'bg-[#0D7A53] text-white shadow-2xs'
              : 'text-slate-400 dark:text-text-muted hover:text-slate-700 dark:hover:text-text'
          }`}
          title="AM"
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodSelect('PM')}
          className={`px-1.5 sm:px-2 py-0.5 font-bold rounded-md text-[9px] sm:text-[10px] transition-all cursor-pointer ${
            currentPeriod === 'PM'
              ? 'bg-[#0D7A53] text-white shadow-2xs'
              : 'text-slate-400 dark:text-text-muted hover:text-slate-700 dark:hover:text-text'
          }`}
          title="PM"
        >
          PM
        </button>
      </div>
    </div>
  );
};

const DEFAULT_PRAYER_TIMES = {
  enabled: true,
  showOnWebsite: true,
  title: 'રાધનપુર મેમણ જમાત',
  subTitle: 'રાધનપુર',
  logo: '',
  fajr: { name: 'ફજર', azan: '05:26 AM', jamat: '05:40 AM', qaza: '06:42 AM', qazaLabel: 'સુધી' },
  zohr: { name: 'ઝોહર', azan: '12:28 PM', jamat: '12:45 PM', qaza: '04:36 PM', qazaLabel: 'સુધી' },
  asr: { name: 'અસર', azan: '04:36 PM', jamat: '04:50 PM', qaza: '06:16 PM', qazaLabel: 'સુધી' },
  maghrib: { name: 'મગરીબ', azan: '06:16 PM', jamat: '06:18 PM', qaza: '07:29 PM', qazaLabel: 'સુધી' },
  isha: { name: 'ઈશા', azan: '07:29 PM', jamat: '07:45 PM', qaza: '05:20 AM', qazaLabel: 'સુધી' },
  tahajjudEnd: '05:25 AM',
  sehriEnd: '05:25 AM',
  sunrise: '06:42 AM',
  ishraq: '06:57 AM',
  chasht: '08:30 AM',
  iftar: '06:16 PM',
  note: '',
  azanOffsetMinutes: 25,
  jamatOffsetMinutes: 15,
  qazaOffsetMinutes: 15,
  notificationsEnabled: true,
  notifications_enabled: true
}

const isPrayerNotificationsActive = (pt) => {
  if (!pt) return true
  if (pt.notificationsEnabled === false || pt.notificationsEnabled === 'false' || pt.notificationsEnabled === 0 || pt.notificationsEnabled === '0') return false
  if (pt.notifications_enabled === false || pt.notifications_enabled === 'false' || pt.notifications_enabled === 0 || pt.notifications_enabled === '0') return false
  if (pt.enabled === false || pt.enabled === 'false' || pt.enabled === 0 || pt.enabled === '0') return false
  return true
}

const DEFAULT_CONFIG = {
  ...DEFAULT_COLORS,
  appLogo: '',
  webLogo: '',
  favicon: '',
  name: typeof window !== 'undefined' && getSubdomainTenant() ? getSubdomainTenant().charAt(0).toUpperCase() + getSubdomainTenant().slice(1) : '',
  email: '',
  phone: '',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  whatsapp: '',
  playStoreUrl: '',
  appStoreUrl: '',
  bannerImages: [],
  // Monday & Friday Push Notification Config - ONLY 3 Keys
  mondayPushTime: '09:00 AM',
  fridayPushKey: 'jummah_mubarak',
  fridayPushTime: '10:00 AM',
  prayerTimes: DEFAULT_PRAYER_TIMES,
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
  'whatsapp',
  'playStoreUrl',
  'appStoreUrl',
  'bannerImages',
  'mondayPushTime',
  'fridayPushKey',
  'fridayPushTime',
  'prayerTimes'
]

const persistWebThemeToLocalStorage = (theme) => {
  WEB_THEME_KEYS.forEach((key) => {
    const value = theme[key]
    const storageKey = `web_${key}`

    if (value === undefined || value === null || value === '') {
      localStorage.removeItem(storageKey)
    } else if (Array.isArray(value)) {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } else {
      localStorage.setItem(storageKey, value)
    }
  })
}

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
const TextInput = ({ label, icon: Icon, value, keyName, placeholder, type = 'text', disabled = false, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange && onChange(keyName, e.target.value)}
      className={`bg-input-bg text-text text-sm py-2 px-3 border border-border rounded-xl outline-none focus:border-primary transition-colors w-full ${
        disabled ? 'opacity-70 cursor-not-allowed bg-surface-secondary/60 font-semibold text-text' : ''
      }`}
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
  const [prayerLogoFile, setPrayerLogoFile] = useState(null)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [showFlyerModal, setShowFlyerModal] = useState(false)
  const cardPreviewRef = useRef(null)
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
      
      const currentSubdomain = getSubdomainTenant()
      let platformName = data.name || ''
      if (currentSubdomain) {
        const formattedSubdomain = currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)
        if (!platformName || !platformName.toLowerCase().includes(currentSubdomain.toLowerCase())) {
          platformName = formattedSubdomain
        }
      }

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
        name: platformName,
        email: data.email || '',
        phone: data.phone || '',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        instagram: data.instagram || '',
        youtube: data.youtube || '',
        whatsapp: data.whatsapp || '',
        playStoreUrl: data.playStoreUrl || data.playstore_url || data.android_app_link || '',
        appStoreUrl: data.appStoreUrl || data.appstore_url || data.ios_app_link || '',
        bannerImages: Array.isArray(data.bannerImages) ? data.bannerImages : [],
        // Monday & Friday Push Notification Config - ONLY 3 Keys
        mondayPushTime: to12Hour(data.mondayPushTime || '09:00 AM'),
        fridayPushKey: data.fridayPushKey || 'jummah_mubarak',
        fridayPushTime: to12Hour(data.fridayPushTime || '10:00 AM'),
        // Dynamic Namaz Timetable Config
        prayerTimes: data.prayerTimes || DEFAULT_PRAYER_TIMES,
      })
      setLogoFiles({ appLogo: null, webLogo: null, favicon: null })
      setPrayerLogoFile(null)
      setNewBannerFiles([])
      setDeletedBannerUrls([])
    } catch (err) {
      setError('Failed to fetch platform configurations')
    } finally {
      setLoading(false)
    }
  }

  const [testingPushDay, setTestingPushDay] = useState(null)

  const handleTestPush = async (day) => {
    try {
      setTestingPushDay(day)
      const res = await api.post('/update_app_theme/test_push', { day })
      toast.success(res.data?.message || `${day === 'friday' ? 'Friday' : 'Monday'} test push sent successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger test push')
    } finally {
      setTestingPushDay(null)
    }
  }

  const [testingPrayer, setTestingPrayer] = useState('fajr')
  const [testingPrayerType, setTestingPrayerType] = useState('azan')
  const [testingPrayerLoading, setTestingPrayerLoading] = useState(false)

  const handleTestPrayerAlert = async () => {
    if (!isPrayerNotificationsActive(config.prayerTimes)) {
      toast.warning('Push Notifications are currently turned OFF. Turn ON the switch to send notifications.')
      return
    }
    try {
      setTestingPrayerLoading(true)
      const res = await api.post('/update_app_theme/test_push', {
        day: 'prayer',
        prayer: testingPrayer,
        alertType: testingPrayerType
      })
      toast.success(res.data?.message || `Test ${testingPrayerType.toUpperCase()} alert sent successfully! (Key: ${res.data?.key})`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger test prayer alert')
    } finally {
      setTestingPrayerLoading(false)
    }
  }

  const handleConfigChange = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  const handlePrayerChange = (path, val) => {
    setConfig(prev => {
      const current = { ...(prev.prayerTimes || DEFAULT_PRAYER_TIMES) };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        current[parent] = {
          ...(current[parent] || {}),
          [child]: val
        };
      } else {
        current[path] = val;
      }
      return { ...prev, prayerTimes: current };
    });
  }

  const handlePrayerLogoChange = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });
    setPrayerLogoFile(compressed);
  }

  const handlePrayerLogoDelete = () => {
    setPrayerLogoFile(null);
    handlePrayerChange('logo', '');
  }

  const handleResetPrayerTimes = async () => {
    if (!await confirm('Reset prayer timetable to defaults (Radhanpur Memon Jamat timings)?', { confirmText: 'Reset', type: 'warning' })) return;
    setConfig(prev => ({
      ...prev,
      prayerTimes: { ...DEFAULT_PRAYER_TIMES }
    }));
    setPrayerLogoFile(null);
    toast.success('Prayer times reset to defaults');
  }

  const handleDownloadCard = async () => {
    if (!cardPreviewRef.current) return;
    setDownloadingCard(true);

    // Create an off-screen container with fixed 440px width to ensure full card capture without sidebar/flex clipping
    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.top = '0';
    offscreenContainer.style.width = '440px';
    offscreenContainer.style.minWidth = '440px';
    offscreenContainer.style.maxWidth = '440px';
    offscreenContainer.style.zIndex = '-99999';
    offscreenContainer.style.overflow = 'visible';
    offscreenContainer.style.background = 'transparent';

    const clone = cardPreviewRef.current.cloneNode(true);
    clone.style.width = '440px';
    clone.style.minWidth = '440px';
    clone.style.maxWidth = '440px';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    try {
      // 1. Wait for fonts to be loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 2. Wait for all images inside clone to be ready
      const imgs = Array.from(clone.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
        })
      );

      let dataUrl = null;

      // 3. Primary export with html-to-image (skipFonts prevents cross-origin cssRules SecurityError)
      try {
        const { toPng } = await import('html-to-image');
        dataUrl = await toPng(clone, {
          skipFonts: true,
          pixelRatio: 2.5,
          cacheBust: false,
          backgroundColor: '#F9F6ED',
          width: 440,
          height: clone.scrollHeight || clone.offsetHeight,
          style: {
            width: '440px',
            minWidth: '440px',
            maxWidth: '440px',
            margin: '0',
            transform: 'none'
          }
        });
      } catch (errHtmlToImage) {
        console.warn('html-to-image export failed, attempting html2canvas:', errHtmlToImage);
      }

      // 4. Secondary fallback with html2canvas
      if (!dataUrl) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(clone, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#F9F6ED',
          width: 440,
          windowWidth: 1200
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl) throw new Error('Failed to generate image data URL');

      // 5. Trigger download safely
      const safeTitle = (config.prayerTimes?.title || 'Jamat')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim();
      const link = document.createElement('a');
      link.download = `Namaz-Timetable-${safeTitle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Namaz timetable flyer downloaded successfully!');
    } catch (err) {
      console.error('Download flyer error:', err);
      toast.error('Failed to download timetable flyer. Please try again.');
    } finally {
      if (offscreenContainer.parentNode) {
        offscreenContainer.parentNode.removeChild(offscreenContainer);
      }
      setDownloadingCard(false);
    }
  };

  const handleLogoChange = async (field, file) => {
    if (!file) return
    const maxDim = field === 'favicon' ? 128 : 512
    const compressed = await compressImage(file, { maxWidth: maxDim, maxHeight: maxDim, quality: 0.85 })
    setLogoFiles(prev => ({ ...prev, [field]: compressed }))
  }

  const handleLogoDelete = (field) => {
    setLogoFiles(prev => ({ ...prev, [field]: null }))
    setConfig(prev => ({ ...prev, [field]: '' }))
  }

  const handleBannerAdd = async (file) => {
    if (!file) return
    const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 })
    setNewBannerFiles(prev => [...prev, compressed])
  }

  const handleBannerDelete = (index, type) => {
    const urlCount = config.bannerImages.filter((_, i) => !deletedBannerUrls.includes(config.bannerImages[i])).length
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
      const textFields = [
        'primaryColor','secondaryColor','backgroundColor','textColor','buttonColor','fontColor','borderColor',
        'gradientStart','gradientEnd','name','email','phone','facebook','twitter','instagram','youtube','whatsapp',
        'playStoreUrl','appStoreUrl',
        'mondayPushTime','fridayPushKey','fridayPushTime'
      ]
      textFields.forEach(key => payload.append(key, config[key] ?? ''))
      payload.append('playstore_url', config.playStoreUrl ?? '')
      payload.append('appstore_url', config.appStoreUrl ?? '')
      payload.append('monday_push_time', to12Hour(config.mondayPushTime ?? '09:00 AM'))
      payload.append('friday_push_key', config.fridayPushKey ?? 'jummah_mubarak')
      payload.append('friday_push_time', to12Hour(config.fridayPushTime ?? '10:00 AM'))

      // Dynamic Prayer Times config
      const isPtActive = isPrayerNotificationsActive(config.prayerTimes)
      const prayerTimesToSave = {
        ...(config.prayerTimes || DEFAULT_PRAYER_TIMES),
        notificationsEnabled: isPtActive,
        notifications_enabled: isPtActive
      }
      payload.append('prayerTimes', JSON.stringify(prayerTimesToSave))
      if (prayerLogoFile) {
        payload.append('prayerLogo', prayerLogoFile)
      }

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
      if (remainingBanners.length === 0 && newBannerFiles.length === 0) {
        // Explicitly send empty string so backend knows to clear all banners
        payload.append('bannerImages', '')
      } else {
        remainingBanners.forEach(url => payload.append('bannerImages', url))
        // New banner files
        newBannerFiles.forEach(file => payload.append('bannerImages', file))
      }

      const updateRes = await api.put('/update_app_theme', payload, {
        timeout: 300000 // 5 minutes for uploading banner images and logos
      })
      const updatedTheme = updateRes.data?.data || updateRes.data || config
      persistWebThemeToLocalStorage(updatedTheme)
      window.dispatchEvent(new Event('web-theme-updated'))
      window.dispatchEvent(new Event('storage'))
      toast.success('Platform configuration updated successfully!')
      fetchConfig()
    } catch (err) {
      console.error('Update config error:', err)
      toast.error(err.response?.data?.message || err.message || 'Failed to save configuration settings')
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
      <div className="flex gap-1.5 sm:gap-2 border-b border-border overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'branding', label: 'Branding & Info', icon: Building2 },
          { key: 'theme', label: 'Theme Colors', icon: Settings },
          { key: 'prayer', label: 'Namaz Timetable', icon: Clock, badge: 'Active' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap cursor-pointer shrink-0
              ${activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'}`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {tab.badge}
              </span>
            )}
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
              <SectionHeader icon={ImageIcon} title="Banner Images (1700 * 600)" />
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
                <TextInput
                  label="Platform Name"
                  icon={Building2}
                  keyName="name"
                  value={config.name}
                  placeholder="e.g. Parivar Community"
                  onChange={handleConfigChange}
                />
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

            {/* Mobile App Download Links */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-glass-sm space-y-4">
              <SectionHeader icon={Smartphone} title="Mobile App Download Links" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Google Play Store Link"
                  icon={Play}
                  keyName="playStoreUrl"
                  value={config.playStoreUrl}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  onChange={handleConfigChange}
                />
                <TextInput
                  label="Apple App Store Link"
                  icon={Apple}
                  keyName="appStoreUrl"
                  value={config.appStoreUrl}
                  placeholder="https://apps.apple.com/app/..."
                  onChange={handleConfigChange}
                />
              </div>
            </div>

            {/* Weekly Scheduled Push Notifications (Monday & Friday Cron Loop) */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-glass-sm space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-text">Weekly Auto Push</h3>
                    <p className="text-[11px] sm:text-xs text-text-secondary">
                      Automated weekly scheduled broadcast notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Cron Active (Every 1 min)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* ── Monday Card ────────────────────────────────────── */}
                <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-secondary/50 dark:bg-surface/50 border border-border space-y-3.5 sm:space-y-4 relative flex flex-col justify-between hover:border-border/80 transition-all">
                  <div className="space-y-3 sm:space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text">Monday Push</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Weekly
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary">Weekly Monday automated push time</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" /> Monday Push Time
                      </label>
                      <TimePicker12Hour
                        value={config.mondayPushTime || '09:00 AM'}
                        onChange={(val) => handleConfigChange('mondayPushTime', val)}
                        themeColor="primary"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" /> 
                      Scheduled: <strong className="text-primary font-bold">{to12Hour(config.mondayPushTime || '09:00 AM')} IST</strong>
                    </span>
                    <button
                      type="button"
                      disabled={testingPushDay === 'monday'}
                      onClick={() => handleTestPush('monday')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 active:scale-98 px-3.5 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span>{testingPushDay === 'monday' ? 'Sending...' : 'Test Monday Push'}</span>
                    </button>
                  </div>
                </div>

                {/* ── Friday Card ────────────────────────────────────── */}
                <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-secondary/50 dark:bg-surface/50 border border-border space-y-3.5 sm:space-y-4 relative flex flex-col justify-between hover:border-border/80 transition-all">
                  <div className="space-y-3 sm:space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text">Friday Push</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Jummah
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary">Weekly Friday automated push</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 items-start">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-xs font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
                          Friday Push Key
                        </label>
                        <input
                          type="text"
                          value={config.fridayPushKey || 'jummah_mubarak'}
                          placeholder="e.g. jummah_mubarak"
                          onChange={(e) => handleConfigChange('fridayPushKey', e.target.value)}
                          className="w-full bg-input-bg text-text text-xs sm:text-sm py-1.5 px-3 border border-border rounded-xl outline-none focus:border-emerald-600 transition-colors font-mono font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-xs font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Friday Time
                        </label>
                        <TimePicker12Hour
                          value={config.fridayPushTime || '10:00 AM'}
                          onChange={(val) => handleConfigChange('fridayPushTime', val)}
                          themeColor="emerald"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Scheduled: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{to12Hour(config.fridayPushTime || '10:00 AM')} IST</strong>
                    </span>
                    <button
                      type="button"
                      disabled={testingPushDay === 'friday'}
                      onClick={() => handleTestPush('friday')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 active:scale-98 px-3.5 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span>{testingPushDay === 'friday' ? 'Sending...' : 'Test Friday Push'}</span>
                    </button>
                  </div>
                </div>
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
              
              <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> Theme Color Tokens
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

        {/* ── TAB: NAMAZ TIMETABLE (PRAYER TIMES) ────────────────────────── */}
        {activeTab === 'prayer' && (
          <div className="space-y-4 sm:space-y-6 w-full">

            {/* ── TOP PANORAMIC MOSQUE BANNER ── */}
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-border shadow-xs p-4 sm:p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-card"
              style={{ minHeight: '96px' }}
            >
              {/* Subtle mosque background with theme-adaptive overlay */}
              <div
                className="absolute inset-0 bg-cover bg-right-bottom pointer-events-none opacity-25 dark:opacity-10"
                style={{ backgroundImage: `url(${mosqueBannerBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 dark:from-card dark:via-card/95 dark:to-card/40 pointer-events-none" />

              {/* Left Side: Mosque Badge + Title & Subtitle */}
              <div className="relative z-10 flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
                  <MosqueIcon className="w-7 h-7 sm:w-9 sm:h-9 text-[#0D7A53] dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-text tracking-tight leading-snug">
                      5 Daily Farz Prayers &amp; Additional Timings
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-[#E8F8F0] dark:bg-emerald-950/60 text-[#0D7A53] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A53] dark:bg-emerald-400 animate-pulse" />
                      Live Synced
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-text-secondary font-medium mt-0.5 line-clamp-2 sm:line-clamp-none">
                    Set Azan, Jamat &amp; Qaza for daily prayers, plus Sehri, Iftar &amp; Sunnah timings
                  </p>
                </div>
              </div>

              {/* Right Side: Responsive Action Buttons */}
              <div className="relative z-10 w-full lg:w-auto grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFlyerModal(true)}
                  className="col-span-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white/95 dark:bg-surface hover:bg-white text-emerald-800 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
                  title="Open Live Flyer Preview & Download"
                >
                  <Eye className="w-4 h-4 text-[#0D7A53] dark:text-emerald-400 shrink-0" />
                  <span>Live Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetPrayerTimes}
                  className="col-span-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white/95 dark:bg-surface hover:bg-white text-slate-700 dark:text-text-secondary border border-slate-200/90 dark:border-border font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98"
                  title="Timetable Defaults & Settings"
                >
                  <Settings className="w-4 h-4 text-slate-600 dark:text-text-muted shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="col-span-2 sm:col-span-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#0D7A53] hover:bg-[#0a6343] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{saveLoading ? 'Saving...' : 'Save Timetable'}</span>
                </button>
              </div>
            </div>

            {/* ── TWO CARDS (SIDE-BY-SIDE ON XL/DESKTOP, STACKED ON TABLET & MOBILE) ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-stretch">

              {/* ── LEFT CARD (xl:col-span-7): 5 Daily Farz Prayers ── */}
              <div className="xl:col-span-7 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Card Header: Calendar Icon + Title */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-text leading-tight">
                          5 Daily Farz Prayers
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-text-muted font-medium">
                          Daily obligatory prayer timings
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      5 Prayers
                    </span>
                  </div>

                  {/* Desktop & Tablet Table View (shown on md and up) */}
                  <div className="hidden md:block overflow-x-auto -mx-1 sm:mx-0 rounded-xl border border-slate-100 dark:border-border/60">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-200/70 dark:border-border text-xs font-bold text-slate-500 dark:text-text-secondary bg-slate-50/50 dark:bg-surface/30">
                          <th className="py-2.5 px-3">Prayer</th>
                          <th className="py-2.5 px-2 text-center">
                            <span className="inline-flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-slate-500" />
                              Azan
                            </span>
                          </th>
                          <th className="py-2.5 px-2 text-center">
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              Jamaat
                            </span>
                          </th>
                          <th className="py-2.5 px-2 text-center">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Qaza Until
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-border/40 text-sm">
                        {[
                          { key: 'fajr', label: 'Fajr', subtitle: 'Morning Prayer', icon: Sun, iconBadge: 'bg-amber-100/90 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400', defaultPeriod: 'AM', qazaPeriod: 'AM', defaultAzan: '05:26', defaultJamat: '05:45', defaultQaza: '06:42' },
                          { key: 'zohr', label: 'Zohr', subtitle: 'Midday Prayer', icon: Sun, iconBadge: 'bg-amber-100/90 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '12:28', defaultJamat: '12:45', defaultQaza: '04:36' },
                          { key: 'asr', label: 'Asr', subtitle: 'Afternoon Prayer', icon: Sun, iconBadge: 'bg-orange-100/90 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '04:36', defaultJamat: '04:50', defaultQaza: '06:16' },
                          { key: 'maghrib', label: 'Maghrib', subtitle: 'Evening Prayer', icon: Sunset, iconBadge: 'bg-rose-100/90 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '06:16', defaultJamat: '06:18', defaultQaza: '07:29' },
                          { key: 'isha', label: 'Isha', subtitle: 'Night Prayer', icon: Moon, iconBadge: 'bg-purple-100/90 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400', defaultPeriod: 'PM', qazaPeriod: 'AM', defaultAzan: '07:29', defaultJamat: '07:45', defaultQaza: '09:25' },
                        ].map(({ key, label, subtitle, icon: Icon, iconBadge, defaultPeriod, qazaPeriod, defaultAzan, defaultJamat, defaultQaza }) => {
                          const prayer = config.prayerTimes?.[key] || {};
                          return (
                            <tr key={key} className="hover:bg-slate-50/60 dark:hover:bg-surface-secondary/40 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBadge}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-800 dark:text-text text-xs sm:text-sm">{label}</div>
                                    <div className="text-[11px] text-slate-400 dark:text-text-muted font-medium">{subtitle}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-1.5 text-center">
                                <div className="flex justify-center">
                                  <PrayerTimeInput
                                    value={prayer.azan || ''}
                                    placeholder={defaultAzan}
                                    defaultPeriod={defaultPeriod}
                                    onChange={(val) => handlePrayerChange(`${key}.azan`, val)}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-1.5 text-center">
                                <div className="flex justify-center">
                                  <PrayerTimeInput
                                    value={prayer.jamat || ''}
                                    placeholder={defaultJamat}
                                    defaultPeriod={defaultPeriod}
                                    onChange={(val) => handlePrayerChange(`${key}.jamat`, val)}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-1.5 text-center">
                                <div className="flex justify-center">
                                  <PrayerTimeInput
                                    value={prayer.qaza || ''}
                                    placeholder={defaultQaza}
                                    defaultPeriod={qazaPeriod}
                                    onChange={(val) => handlePrayerChange(`${key}.qaza`, val)}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (shown on screens smaller than md) */}
                  <div className="block md:hidden space-y-3">
                    {[
                      { key: 'fajr', label: 'Fajr', subtitle: 'Morning Prayer', icon: Sun, iconBadge: 'bg-amber-100/90 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400', defaultPeriod: 'AM', qazaPeriod: 'AM', defaultAzan: '05:26', defaultJamat: '05:45', defaultQaza: '06:42' },
                      { key: 'zohr', label: 'Zohr', subtitle: 'Midday Prayer', icon: Sun, iconBadge: 'bg-amber-100/90 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '12:28', defaultJamat: '12:45', defaultQaza: '04:36' },
                      { key: 'asr', label: 'Asr', subtitle: 'Afternoon Prayer', icon: Sun, iconBadge: 'bg-orange-100/90 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '04:36', defaultJamat: '04:50', defaultQaza: '06:16' },
                      { key: 'maghrib', label: 'Maghrib', subtitle: 'Evening Prayer', icon: Sunset, iconBadge: 'bg-rose-100/90 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400', defaultPeriod: 'PM', qazaPeriod: 'PM', defaultAzan: '06:16', defaultJamat: '06:18', defaultQaza: '07:29' },
                      { key: 'isha', label: 'Isha', subtitle: 'Night Prayer', icon: Moon, iconBadge: 'bg-purple-100/90 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400', defaultPeriod: 'PM', qazaPeriod: 'AM', defaultAzan: '07:29', defaultJamat: '07:45', defaultQaza: '09:25' },
                    ].map(({ key, label, subtitle, icon: Icon, iconBadge, defaultPeriod, qazaPeriod, defaultAzan, defaultJamat, defaultQaza }) => {
                      const prayer = config.prayerTimes?.[key] || {};
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-surface/40 hover:bg-white dark:hover:bg-surface transition-all space-y-2.5"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBadge}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-text text-sm">{label}</span>
                                <span className="text-[11px] text-slate-400 dark:text-text-muted font-medium">({subtitle})</span>
                              </div>
                            </div>
                          </div>

                          {/* 3 fields grid */}
                          <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-border/60">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-text-secondary flex items-center gap-1">
                                <Megaphone className="w-3 h-3 text-emerald-600 shrink-0" /> Azan
                              </span>
                              <PrayerTimeInput
                                value={prayer.azan || ''}
                                placeholder={defaultAzan}
                                defaultPeriod={defaultPeriod}
                                onChange={(val) => handlePrayerChange(`${key}.azan`, val)}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-text-secondary flex items-center gap-1">
                                <Users className="w-3 h-3 text-emerald-600 shrink-0" /> Jamaat
                              </span>
                              <PrayerTimeInput
                                value={prayer.jamat || ''}
                                placeholder={defaultJamat}
                                defaultPeriod={defaultPeriod}
                                onChange={(val) => handlePrayerChange(`${key}.jamat`, val)}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-text-secondary flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600 shrink-0" /> Qaza Until
                              </span>
                              <PrayerTimeInput
                                value={prayer.qaza || ''}
                                placeholder={defaultQaza}
                                defaultPeriod={qazaPeriod}
                                onChange={(val) => handlePrayerChange(`${key}.qaza`, val)}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="rounded-xl bg-[#E8F8F0]/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0D7A53] dark:text-emerald-400 font-medium mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#0D7A53] dark:bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">i</div>
                    <span>Changes preview live on the flyer in real-time</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFlyerModal(true)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-[#0D7A53] hover:bg-[#0a6343] active:scale-98 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer self-end sm:self-auto shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {/* ── RIGHT CARD (xl:col-span-5): Additional Timings + Announcement ── */}
              <div className="xl:col-span-5 bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Card Header: Sun Icon + Title & Subtitle */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-text leading-tight">
                        Additional Timings
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 dark:text-text-muted font-medium">
                        Tahajjud, Sehri, Sunrise, Ishraq, Chasht &amp; Iftar
                      </p>
                    </div>
                  </div>

                  {/* 6 Timing Cards in Adaptive Grid (1 col on small mobile, 2 col on mobile, 3 col on tablet, 2 col on laptop) */}
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-2 sm:gap-2.5">
                    {[
                      { key: 'tahajjudEnd', label: 'Tahajjud', icon: Moon, iconBadge: 'bg-purple-100 text-indigo-700 dark:bg-purple-950/60 dark:text-indigo-400', placeholder: '05:25', defaultPeriod: 'AM' },
                      { key: 'sehriEnd', label: 'Sehri', icon: Sunrise, iconBadge: 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400', placeholder: '06:42', defaultPeriod: 'AM' },
                      { key: 'sunrise', label: 'Sunrise', icon: Sun, iconBadge: 'bg-orange-100 text-orange-500 dark:bg-orange-950/60 dark:text-orange-400', placeholder: '04:36', defaultPeriod: 'AM' },
                      { key: 'ishraq', label: 'Ishraq', icon: Compass, iconBadge: 'bg-sky-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400', placeholder: '06:57', defaultPeriod: 'AM' },
                      { key: 'chasht', label: 'Chasht', icon: Sun, iconBadge: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400', placeholder: '08:30', defaultPeriod: 'AM' },
                      { key: 'iftar', label: 'Iftar', icon: Moon, iconBadge: 'bg-purple-100 text-indigo-700 dark:bg-purple-950/60 dark:text-indigo-400', placeholder: '06:16', defaultPeriod: 'PM' },
                    ].map(({ key, label, icon: Icon, iconBadge, placeholder, defaultPeriod }) => (
                      <div
                        key={key}
                        className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-surface hover:border-emerald-500/40 shadow-2xs space-y-2 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${iconBadge}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-text">{label}</span>
                        </div>
                        <div>
                          <PrayerTimeInput
                            value={config.prayerTimes?.[key] || ''}
                            placeholder={placeholder}
                            defaultPeriod={defaultPeriod}
                            onChange={(val) => handlePrayerChange(key, val)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Note / Announcement Box */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-text">
                      <Megaphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Special Note / Announcement</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-text-muted font-normal">
                      Displays on Flyer
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.prayerTimes?.note || ''}
                    placeholder="e.g. Friday Jummah Khutbah starts at 01:15 PM..."
                    onChange={(e) => handlePrayerChange('note', e.target.value)}
                    className="w-full bg-slate-50/70 dark:bg-surface text-slate-800 dark:text-text text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-3.5 border border-slate-200/90 dark:border-border rounded-xl outline-none focus:border-emerald-600 shadow-2xs transition-colors placeholder:text-slate-400"
                  />
                </div>
              </div>

            </div>

            {/* ── LOWER ROW: PUSH NOTIFICATION ALERTS ── */}
            <div className="bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">Push Notification Alerts</h4>
                    <p className="text-xs text-text-secondary">
                      Automatic reminders sent to members' mobile devices
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                    isPrayerNotificationsActive(config.prayerTimes)
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isPrayerNotificationsActive(config.prayerTimes)
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}></span>
                    {isPrayerNotificationsActive(config.prayerTimes) ? 'Active' : 'Off'}
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer select-none" title="Toggle Push Notifications ON / OFF">
                    <input
                      type="checkbox"
                      checked={isPrayerNotificationsActive(config.prayerTimes)}
                      onChange={async (e) => {
                        const newEnabled = Boolean(e.target.checked)
                        handlePrayerChange('notificationsEnabled', newEnabled)
                        handlePrayerChange('notifications_enabled', newEnabled)
                        try {
                          const updatedPrayerTimes = {
                            ...(config.prayerTimes || DEFAULT_PRAYER_TIMES),
                            notificationsEnabled: newEnabled,
                            notifications_enabled: newEnabled
                          }
                          const fd = new FormData()
                          fd.append('prayerTimes', JSON.stringify(updatedPrayerTimes))
                          await api.put('/update_app_theme', fd)
                          toast.success(newEnabled ? 'Push Notifications turned ON' : 'Push Notifications turned OFF')
                        } catch (err) {
                          console.error('Failed to toggle notification status:', err)
                          toast.error('Failed to update notification status')
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                  </label>
                </div>
              </div>

              {!isPrayerNotificationsActive(config.prayerTimes) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Push notifications are currently turned <strong>OFF</strong>. Members will not receive any Azan, Jamat, or Qaza reminders on mobile.</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left: Advance Reminder Timing (7 cols on lg, full on mobile/tablet) */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="text-xs font-bold text-text flex items-center justify-between">
                    <span>Advance Reminder Timing</span>
                    <span className="text-[10px] text-text-muted">Offsets before prayer</span>
                  </div>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Azan Offset */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-surface border border-border/70 flex flex-row min-[380px]:flex-col justify-between items-center min-[380px]:items-start gap-1.5">
                      <div>
                        <span className="text-xs font-bold text-text leading-tight block">Azan Alert</span>
                        <p className="text-[9px] text-text-muted leading-tight min-[380px]:hidden">Before Azan</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={config.prayerTimes?.azanOffsetMinutes ?? 25}
                          onChange={(e) => handlePrayerChange('azanOffsetMinutes', parseInt(e.target.value, 10) || '')}
                          className="w-12 bg-input-bg text-emerald-600 font-bold font-mono text-center text-xs py-1 border border-border rounded-lg outline-none focus:border-emerald-600 shadow-xs"
                        />
                        <span className="text-[10px] font-semibold text-text-secondary">min</span>
                      </div>
                      <p className="text-[9px] text-text-muted leading-tight hidden min-[380px]:block">
                        Before Azan
                      </p>
                    </div>

                    {/* Jamat Offset */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-surface border border-border/70 flex flex-row min-[380px]:flex-col justify-between items-center min-[380px]:items-start gap-1.5">
                      <div>
                        <span className="text-xs font-bold text-text leading-tight block">Jamat Alert</span>
                        <p className="text-[9px] text-text-muted leading-tight min-[380px]:hidden">Before Jamat</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={config.prayerTimes?.jamatOffsetMinutes ?? 15}
                          onChange={(e) => handlePrayerChange('jamatOffsetMinutes', parseInt(e.target.value, 10) || '')}
                          className="w-12 bg-input-bg text-emerald-600 font-bold font-mono text-center text-xs py-1 border border-border rounded-lg outline-none focus:border-emerald-600 shadow-xs"
                        />
                        <span className="text-[10px] font-semibold text-text-secondary">min</span>
                      </div>
                      <p className="text-[9px] text-text-muted leading-tight hidden min-[380px]:block">
                        Before Jamat
                      </p>
                    </div>

                    {/* Qaza Offset */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-surface border border-border/70 flex flex-row min-[380px]:flex-col justify-between items-center min-[380px]:items-start gap-1.5">
                      <div>
                        <span className="text-xs font-bold text-text leading-tight block">Qaza Warn</span>
                        <p className="text-[9px] text-text-muted leading-tight min-[380px]:hidden">Before Qaza</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={config.prayerTimes?.qazaOffsetMinutes ?? 15}
                          onChange={(e) => handlePrayerChange('qazaOffsetMinutes', parseInt(e.target.value, 10) || '')}
                          className="w-12 bg-input-bg text-amber-600 font-bold font-mono text-center text-xs py-1 border border-border rounded-lg outline-none focus:border-amber-600 shadow-xs"
                        />
                        <span className="text-[10px] font-semibold text-text-secondary">min</span>
                      </div>
                      <p className="text-[9px] text-text-muted leading-tight hidden min-[380px]:block">
                        Before Qaza
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Test Alert Broadcast (5 cols on lg, full on mobile/tablet) */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="text-xs font-bold text-text flex items-center justify-between">
                    <span>Test Alert Broadcast</span>
                    <span className="text-[10px] text-text-muted">Instant verify</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border/70 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="min-w-0">
                        <label className="text-[10px] font-semibold text-text-muted mb-1 block">Prayer</label>
                        <Select
                          value={testingPrayer}
                          onChange={(val) => setTestingPrayer(val)}
                          options={[
                            { value: 'fajr', label: 'Fajr' },
                            { value: 'zohr', label: 'Zohr' },
                            { value: 'asr', label: 'Asr' },
                            { value: 'maghrib', label: 'Maghrib' },
                            { value: 'isha', label: 'Isha' },
                          ]}
                          searchable={false}
                          className="text-xs"
                          placement="up"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className="text-[10px] font-semibold text-text-muted mb-1 block">Type</label>
                        <Select
                          value={testingPrayerType}
                          onChange={(val) => setTestingPrayerType(val)}
                          options={[
                            { value: 'azan', label: `Azan (${config.prayerTimes?.azanOffsetMinutes ?? 25}m)` },
                            { value: 'jamat', label: `Jamat (${config.prayerTimes?.jamatOffsetMinutes ?? 15}m)` },
                            { value: 'qaza', label: `Qaza (${config.prayerTimes?.qazaOffsetMinutes ?? 15}m)` },
                          ]}
                          searchable={false}
                          className="text-xs"
                          placement="up"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestPrayerAlert}
                      disabled={testingPrayerLoading || !isPrayerNotificationsActive(config.prayerTimes)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>
                        {!isPrayerNotificationsActive(config.prayerTimes)
                          ? 'Notifications Disabled (Turn ON to Send)'
                          : testingPrayerLoading
                            ? 'Sending Alert...'
                            : 'Send Test Alert'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden offscreen mount to ensure DOM ref for card download always exists in standard flyer resolution */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '440px', pointerEvents: 'none', opacity: 0 }}>
              <NamazTimetableCard
                ref={cardPreviewRef}
                prayerTimes={config.prayerTimes}
              />
            </div>

            {/* ── MODAL: LIVE FLYER PREVIEW & DOWNLOAD ── */}
            {showFlyerModal && (
              <div
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-fade-in"
                onClick={() => setShowFlyerModal(false)}
              >
                <div
                  className="relative bg-white dark:bg-card rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-border max-w-[480px] w-full p-4 sm:p-6 space-y-3.5 sm:space-y-4 my-4 sm:my-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D7A53] dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-text">
                          Namaz Timetable Flyer Preview
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-text-muted font-medium">
                          Live synchronized real-time preview
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFlyerModal(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-surface-secondary text-slate-500 hover:text-slate-800 dark:hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                      title="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Rendered Namaz Timetable Card */}
                  <div className="flex justify-center p-2 sm:p-3 bg-slate-50 dark:bg-surface-secondary/40 rounded-2xl border border-slate-200/80 dark:border-border/80 overflow-x-auto max-h-[70vh]">
                    <div className="w-full max-w-[420px]">
                      <NamazTimetableCard
                        ref={cardPreviewRef}
                        prayerTimes={config.prayerTimes}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadCard}
                      disabled={downloadingCard}
                      className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#1E5733] to-[#144225] hover:from-[#266D40] hover:to-[#1B522E] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>{downloadingCard ? 'Generating HD Flyer...' : 'Download Timetable Flyer (PNG HD)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFlyerModal(false)}
                      className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-text-muted dark:hover:text-text transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

</form>
    </div>
  )
}