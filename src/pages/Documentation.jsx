import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Shield,
  Layers,
  Users,
  UserCog,
  ShieldCheck,
  CalendarDays,
  Briefcase,
  Megaphone,
  IndianRupee,
  Database,
  Settings,
  Languages,
  CheckCircle2,
  ChevronRight,
  Printer,
  Sparkles,
  ArrowRight,
  Activity,
  Lock,
  Globe,
  FileText,
  Search,
  Code2,
  Key,
  Compass,
  ArrowLeft,
  X,
  ZoomIn,
  Download,
  Eye,
  Maximize2,
  ChevronDown,
  ArrowUp,
  SlidersHorizontal,
  Bookmark,
  Share2,
  Check,
  Server,
  Cpu,
  Terminal,
  Grid
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { docTranslations } from '../data/documentationData'
import ThemePicker from '../components/ThemePicker'

export default function Documentation() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('parivar_doc_lang') || 'en')
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lightboxImage, setLightboxImage] = useState(null)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)

  const contentContainerRef = useRef(null)
  const langDropdownRef = useRef(null)
  const portalMenuRef = useRef(null)

  const t = docTranslations[lang] || docTranslations.en

  useEffect(() => {
    localStorage.setItem('parivar_doc_lang', lang)
  }, [lang])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        langDropdownRef.current && 
        !langDropdownRef.current.contains(e.target) &&
        portalMenuRef.current &&
        !portalMenuRef.current.contains(e.target)
      ) {
        setIsLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  const toggleLangDropdown = () => {
    if (!isLangDropdownOpen && langDropdownRef.current) {
      const rect = langDropdownRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
    setIsLangDropdownOpen(!isLangDropdownOpen)
  }

  // Update dropdown position on resize/scroll
  useEffect(() => {
    if (!isLangDropdownOpen) return
    const updatePos = () => {
      if (langDropdownRef.current) {
        const rect = langDropdownRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        })
      }
    }
    window.addEventListener('resize', updatePos)
    return () => window.removeEventListener('resize', updatePos)
  }, [isLangDropdownOpen])

  const categories = [
    { id: 'all', label: lang === 'gu' ? 'બધા મોડ્યુલ્સ' : lang === 'hi' ? 'सभी मॉड्यूल्स' : 'All Modules' },
    { id: 'core', label: lang === 'gu' ? 'મુખ્ય અને સુરક્ષા' : lang === 'hi' ? 'कोर व सुरक्षा' : 'Core & Security' },
    { id: 'tabs', label: lang === 'gu' ? 'પ્રવૃત્તિઓ અને સેવાઓ' : lang === 'hi' ? 'गतिविधियां व सेवाएं' : 'Activities & Services' },
    { id: 'finance', label: lang === 'gu' ? 'નાણાં અને માસ્ટર્સ' : lang === 'hi' ? 'वित्त व मास्टर्स' : 'Finance & Masters' }
  ]

  const navItems = [
    { id: 'overview', label: t.nav.overview, icon: BookOpen, badge: 'Core', category: 'core', num: '01' },
    { id: 'dashboard', label: t.nav.dashboard, icon: Activity, badge: 'Analytics', category: 'core', num: '02' },
    { id: 'members', label: t.nav.members, icon: Users, badge: 'Directory', category: 'core', num: '03' },
    { id: 'committee', label: t.nav.committee, icon: UserCog, badge: 'Leadership', category: 'core', num: '04' },
    { id: 'roles', label: t.nav.roles, icon: ShieldCheck, badge: 'RBAC', category: 'core', num: '05' },
    { id: 'activities', label: t.nav.activities, icon: CalendarDays, badge: '4-in-1', category: 'tabs', num: '06' },
    { id: 'services', label: t.nav.services, icon: Briefcase, badge: '3-in-1', category: 'tabs', num: '07' },
    { id: 'media', label: t.nav.media, icon: Megaphone, badge: '3-in-1', category: 'tabs', num: '08' },
    { id: 'engagements', label: t.nav.engagements, icon: IndianRupee, badge: '2-in-1', category: 'finance', num: '09' },
    { id: 'masters', label: t.nav.masters, icon: Database, badge: '10-in-1', category: 'finance', num: '10' },
    { id: 'settings', label: t.nav.settings, icon: Settings, badge: 'Config', category: 'finance', num: '11' }
  ]

  const languageOptions = [
    { code: 'en', label: 'English (EN)', tabLabel: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी (Hindi)', tabLabel: 'हिंदी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)', tabLabel: 'ગુજરાતી', flag: '🇮🇳' }
  ]

  const currentLanguage = languageOptions.find((l) => l.code === lang) || languageOptions[0]

  const filteredNavItems = navItems.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const isManualScrolling = useRef(false)
  const manualScrollTimer = useRef(null)

  const scrollToSection = (id) => {
    setActiveSection(id)
    isManualScrolling.current = true
    if (manualScrollTimer.current) clearTimeout(manualScrollTimer.current)

    const element = document.getElementById(id)
    if (element && contentContainerRef.current) {
      const topOffset = element.offsetTop - 16
      contentContainerRef.current.scrollTo({
        top: topOffset,
        behavior: 'smooth'
      })
    }

    // Release lock after smooth scroll completes (approx 450ms)
    manualScrollTimer.current = setTimeout(() => {
      isManualScrolling.current = false
    }, 450)
  }

  const handleContentScroll = (e) => {
    const container = e.target
    const scrollPos = container.scrollTop + 140

    // Reading progress
    const totalHeight = container.scrollHeight - container.clientHeight
    if (totalHeight > 0) {
      const progress = Math.min(100, Math.round((container.scrollTop / totalHeight) * 100))
      setReadingProgress(progress)
    }

    setShowScrollTop(container.scrollTop > 300)

    // Only update active section on genuine user scroll, not during programmatic jump
    if (!isManualScrolling.current) {
      for (let i = navItems.length - 1; i >= 0; i--) {
        const el = document.getElementById(navItems[i].id)
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }
  }

  const scrollToTop = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Ultra-Modern Screenshot Showcase Card
  const ModernImageCard = ({ src, caption, title, tag = 'UI Preview' }) => (
    <div
      onClick={() => setLightboxImage({ src, caption: caption || title })}
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-b from-surface to-surface-secondary/40 shadow-sm hover:shadow-glass-lg hover:border-primary/50 transition-all duration-300 w-full"
    >
      {/* Top Card Bar */}
      <div className="px-5 py-3 border-b border-border/60 bg-surface-secondary/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-bold text-text-secondary pl-2 border-l border-border/60">
            {title || caption}
          </span>
        </div>
        <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {tag}
        </span>
      </div>

      {/* Image Viewport */}
      <div className="relative overflow-hidden w-full max-h-[520px] bg-black/[0.02] dark:bg-black/20 flex items-center justify-center p-3 sm:p-5">
        <img
          src={src}
          alt={caption || 'Preview'}
          className="w-full h-auto object-contain max-h-[480px] rounded-xl group-hover:scale-[1.01] transition-transform duration-300 shadow-sm border border-border/40"
          loading="lazy"
        />
        
        {/* Floating Zoom Action Pill */}
        <div className="absolute inset-0 bg-primary/15 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
          <div className="px-5 py-2.5 rounded-xl bg-surface/95 text-primary font-bold text-xs shadow-2xl border border-primary/30 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <ZoomIn className="w-4 h-4" />
            <span>Click to Expand in Full Resolution</span>
          </div>
        </div>
      </div>

      {/* Caption Bottom Bar */}
      {caption && (
        <div className="px-5 py-3 bg-surface border-t border-border/70 flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span className="font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary shrink-0" />
            {caption}
          </span>
          <span className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Enlarge</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col gap-2.5 relative select-none font-sans antialiased">
      
      {/* ─── Reading Progress Bar ────────────────────────────────────────── */}
      <div className="w-full h-1 bg-surface-secondary/60 rounded-full overflow-hidden shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary-light to-indigo-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* ─── Top Documentation Header Bar ────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/90 backdrop-blur-xl border border-border/80 rounded-2xl px-6 py-3.5 min-h-[60px] shadow-glass-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0"
      >
        <div className="flex items-center gap-4">
          {/* Back to Panel Button */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover shadow-md shadow-primary/20 transition-all cursor-pointer group shrink-0"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Panel</span>
          </button>

          <div className="h-6 w-px bg-border hidden sm:block"></div>

          {/* Title block */}
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-text">
              {t.header.title}
            </h1>
          </div>
        </div>

        {/* Language Tabs Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary/70 border border-border rounded-xl">
          {languageOptions.map((opt) => {
            const isSelected = opt.code === lang
            return (
              <button
                key={opt.code}
                onClick={() => setLang(opt.code)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-surface'
                }`}
              >
                <span className="text-sm">{opt.flag}</span>
                <span>{opt.tabLabel}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ─── Two-Column Viewport: Left Sidebar (260px-300px) + Right Content ─────────────────────────────────── */}
      <div className="flex gap-3 flex-1 h-[calc(100vh-90px)] min-h-[500px] overflow-hidden">
        
        {/* ── Clean Left Sidebar (Pure TOC Navigation + Bottom Help Box) ── */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-72 xl:w-80 flex flex-col h-full bg-surface border border-border/80 rounded-2xl shadow-sm overflow-hidden shrink-0"
        >
          {/* Nav Items List */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 min-h-[46px] rounded-xl text-xs sm:text-[13.5px] font-bold transition-all text-left group cursor-pointer leading-relaxed ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-0.5'
                      : 'text-text-secondary hover:bg-surface-secondary/70 hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 py-0.5">
                    <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform ${isActive ? 'text-white stroke-[2.4]' : 'text-text-secondary group-hover:text-primary'}`} />
                    <span className="truncate leading-relaxed pt-0.5 pb-0.5">{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Reference Box: Video Tutorials & Help Card */}
          <div className="p-3.5 border-t border-border/70 bg-surface-secondary/30 shrink-0">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-primary to-purple-900 text-white shadow-md space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  ▶
                </div>
                <span>Video Tutorials</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Watch step-by-step video guides on Parivar Portal.
              </p>
              <button
                onClick={() => window.open('https://youtube.com', '_blank')}
                className="w-full py-2 px-3 rounded-xl bg-white text-primary font-bold text-xs shadow-sm hover:bg-white/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Watch Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Right Scrollable Content Area ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          ref={contentContainerRef}
          onScroll={handleContentScroll}
          className="flex-1 h-full overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-24 rounded-2xl relative scroll-smooth"
        >

          {/* 1. Introduction Section (Exact 100% Viewport First Page Fit) */}
          <section id="overview" className="bg-surface border border-border/80 rounded-3xl p-5 lg:p-6 shadow-glass-md flex flex-col justify-between min-h-full space-y-4">
            
            {/* Top Welcome Hero Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-3.5 shrink-0">
              <div className="space-y-1 max-w-3xl">
                <h2 className="text-xl lg:text-2xl font-black text-text tracking-tight leading-tight">
                  {t.sections.overview.welcomeTitle}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-primary">
                  {t.sections.overview.welcomeSubtitle}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                  {t.sections.overview.welcomeDesc}
                </p>
              </div>

              {/* Graphic Banner Badge */}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary shrink-0 shadow-inner relative overflow-hidden group">
                <Compass className="w-8 h-8 stroke-[1.8] text-primary transition-transform group-hover:rotate-45 duration-300" />
                <span className="text-[9px] font-black uppercase tracking-wider text-primary pt-0.5">Guide 2.0</span>
              </div>
            </div>

            {/* Two Column Introduction Grid matching ProManager reference */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
              
              {/* ── Left Column: Notice Pill + Why Box with Target Graphic + Contact Support ── */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                
                {/* 1. Top Informational Notice Box (ProManager style) */}
                <div className="p-3.5 rounded-2xl bg-primary/8 border border-primary/20 flex items-center gap-3 text-xs text-text-secondary shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    ℹ
                  </div>
                  <p className="text-[11.5px] leading-snug font-medium">
                    You can explore and configure all modules below to manage your community smoothly.
                  </p>
                </div>

                {/* 2. "Why Parivar Platform?" with Target Graphic & Rich Filled Content */}
                <div className="p-5 sm:p-6 rounded-3xl bg-surface-secondary/40 border border-border/80 space-y-4 shadow-sm flex-1 flex flex-col justify-between relative overflow-hidden">
                  
                  {/* Top Header & Sub-banner */}
                  <div className="space-y-2 border-b border-border/60 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-sm sm:text-base font-extrabold text-primary">
                        <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                        <span>{t.sections.overview.whyTitle}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        Unified Ecosystem
                      </span>
                    </div>
                    <p className="text-[11.5px] text-text-secondary leading-snug">
                      Purpose-built tools empowering community administration, family transparency, and welfare operations.
                    </p>
                  </div>

                  {/* Middle Feature Points Grid + Target Graphic */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center flex-1 py-1">
                    {/* Left Points */}
                    <div className="sm:col-span-8 space-y-2">
                      {t.sections.overview.whyPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed p-1.5 rounded-lg hover:bg-surface/60 transition-colors">
                          <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                            ✓
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-text">{typeof point === 'object' ? point.title : point}</span>
                            {typeof point === 'object' && point.desc && (
                              <p className="text-[11px] text-text-secondary leading-snug line-clamp-1">{point.desc}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right Target Graphic (Matching SVG Bullseye in Reference) */}
                    <div className="sm:col-span-4 flex flex-col items-center justify-center gap-2">
                      <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center relative bg-primary/5 shadow-inner">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/40 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          </div>
                        </div>
                        {/* Dart arrow indicator */}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] shadow-sm transform rotate-45">
                          ➹
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider text-center">
                        Goal-Driven
                      </span>
                    </div>
                  </div>

                  {/* Bottom Highlight Pill Bar (Fills lower empty area) */}
                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary bg-surface/50 p-2.5 rounded-xl border border-border/70">
                    <span className="flex items-center gap-1.5 font-semibold text-text">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Zero-data redundancy</span>
                    </span>
                    <span className="font-bold text-primary">100% Cloud Synced</span>
                  </div>

                </div>

                {/* 3. Contact & Support Box */}
                <div className="p-4 sm:p-4.5 rounded-2xl bg-surface-secondary/30 border border-border/80 space-y-2 text-xs text-text-secondary shrink-0 shadow-xs">
                  <div className="font-bold text-text flex items-center gap-2 text-xs sm:text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{t.sections.overview.supportTitle}</span>
                  </div>
                  <div className="space-y-1 text-[11.5px] pt-0.5">
                    <p><strong className="text-text font-semibold">Website:</strong> <a href={t.sections.overview.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{t.sections.overview.website}</a></p>
                    <p><strong className="text-text font-semibold">Support Helpline:</strong> <span className="text-text font-mono font-bold">{t.sections.overview.phone}</span></p>
                  </div>
                </div>

              </div>

              {/* ── Right Column: Setup Progress with Connected Stepper & 'More →' Buttons ── */}
              <div className="lg:col-span-7 flex flex-col space-y-3.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <h3 className="text-sm sm:text-base font-black text-text flex items-center gap-2">
                    <span>{t.sections.overview.setupProgressTitle}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    Step-by-Step Flow
                  </span>
                </div>

                {/* Stepper List with Left Numbered Circles and Connected Vertical Spine Line */}
                <div className="relative space-y-3 flex-1 flex flex-col justify-between pt-1">
                  
                  {/* Subtle vertical spine track behind numbers */}
                  <div className="absolute top-5 bottom-5 left-4 w-0.5 bg-border -z-0 hidden sm:block"></div>

                  {t.sections.overview.setupSteps.map((step, i) => {
                    const stepIcons = [Database, ShieldCheck, Users, UserCog, CalendarDays, Settings]
                    const StepIcon = stepIcons[i] || Layers
                    const targetIds = ['masters', 'roles', 'members', 'committee', 'activities', 'settings']
                    return (
                      <div
                        key={i}
                        onClick={() => scrollToSection(targetIds[i] || 'overview')}
                        className="group relative z-10 p-3.5 sm:p-4 rounded-2xl bg-surface border border-border/80 hover:border-primary/50 hover:bg-surface-secondary/50 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-xs hover:shadow-md flex-1"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Number Circle Badge */}
                          <div className="w-8 h-8 rounded-full bg-surface text-text-secondary border border-border group-hover:border-primary group-hover:bg-primary group-hover:text-white font-black text-xs flex items-center justify-center shrink-0 transition-colors shadow-xs">
                            {i + 1}
                          </div>

                          {/* Theme-colored Module Icon */}
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <StepIcon className="w-4 h-4" />
                          </div>

                          {/* Titles and Sub-caption */}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-text group-hover:text-primary transition-colors truncate">
                              {step.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-text-secondary leading-snug line-clamp-1 pt-0.5">
                              {step.desc}
                            </p>
                          </div>
                        </div>

                        {/* Reference Mockup Style: 'More →' Pill Button */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border group-hover:border-primary/40 bg-surface-secondary/40 group-hover:bg-primary group-hover:text-white text-text-secondary text-xs font-bold transition-all shrink-0 shadow-2xs">
                          <span>More</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </section>

          {/* 2. Dashboard Section */}
          <section id="dashboard" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.dashboard.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.dashboard.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.sections.dashboard.features.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface-secondary/35 border border-border/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-text flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    {f.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Showcase Screenshot */}
            <div className="pt-2">
              <ModernImageCard src={t.sections.dashboard.image} caption={t.sections.dashboard.imageCaption} title="Dashboard Telemetry" tag="Live Analytics" />
            </div>
          </section>

          {/* 4. Members Section */}
          <section id="members" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.members.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.members.title}</h2>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-surface-secondary/25 border border-border/80">
              {t.sections.members.points.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {/* Screenshots */}
            <div className="space-y-5 pt-2">
              <ModernImageCard src={t.sections.members.image} caption={t.sections.members.imageCaption} title="Member Directory Index" tag="Registry" />
              <ModernImageCard src={t.sections.members.modalImage} caption={t.sections.members.modalCaption} title="Add Member Dialog" tag="Modal View" />
            </div>
          </section>

          {/* 5. Committee Leadership */}
          <section id="committee" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.committee.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.committee.title}</h2>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-surface-secondary/25 border border-border/80">
              {t.sections.committee.points.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {/* Screenshot */}
            <div className="pt-2">
              <ModernImageCard src={t.sections.committee.modalImage} caption={t.sections.committee.modalCaption} title="Committee Member Setup" tag="Leadership" />
            </div>
          </section>

          {/* 6. Roles & Permission Matrix */}
          <section id="roles" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.roles.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.roles.title}</h2>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-surface-secondary/25 border border-border/80">
              {t.sections.roles.points.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {/* Screenshots */}
            <div className="space-y-5 pt-2">
              <ModernImageCard src={t.sections.roles.image} caption={t.sections.roles.imageCaption} title="Role Governance Table" tag="Access Index" />
              <ModernImageCard src={t.sections.roles.modalImage} caption={t.sections.roles.modalCaption} title="Granular Permission Matrix Grid" tag="Matrix Editor" />
            </div>
          </section>

          {/* 7. Activities Module (4-in-1) */}
          <section id="activities" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.activities.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.activities.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.sections.activities.tabs.map((tab, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface-secondary/35 border border-border/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-primary">{tab.name}</h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{tab.desc}</p>
                </div>
              ))}
            </div>

            {/* Screenshot */}
            <div className="pt-2">
              <ModernImageCard src={t.sections.activities.image} caption={t.sections.activities.imageCaption} title="Activities Unified 4-in-1 Navigation" tag="Unified Hub" />
            </div>
          </section>

          {/* 8. Services Module (3-in-1) */}
          <section id="services" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.services.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.services.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {t.sections.services.tabs.map((tab, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface-secondary/35 border border-border/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-primary">{tab.name}</h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{tab.desc}</p>
                </div>
              ))}
            </div>

            {/* Complete Services Screenshots */}
            <div className="space-y-5 pt-2">
              <ModernImageCard src="/documention/servicestab.png" caption="Businesses Directory & Enterprise Listings" title="Businesses Directory" tag="Services Tab 1" />
              <ModernImageCard src="/documention/servicestabstudent.png" caption="Students Academic Achievements & Incentive Records" title="Students Registry" tag="Services Tab 2" />
              <ModernImageCard src="/documention/servicestabmatrimonil.png" caption="Matrimonial Confidential Biodata Registry" title="Matrimonial Hub" tag="Services Tab 3" />
            </div>
          </section>

          {/* 9. Media & Content Moderation (3-in-1) */}
          <section id="media" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.media.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.media.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {t.sections.media.tabs.map((tab, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface-secondary/35 border border-border/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-primary">{tab.name}</h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{tab.desc}</p>
                </div>
              ))}
            </div>

            {/* Screenshot */}
            <div className="pt-2">
              <ModernImageCard src="/documention/mediatab.png" caption={t.sections.media.imageCaption} title="Media Broadcast & Moderator" tag="Media Hub" />
            </div>
          </section>

          {/* 10. Engagements & Financial Records (2-in-1) */}
          <section id="engagements" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.engagements.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.engagements.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.sections.engagements.tabs.map((tab, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface-secondary/35 border border-border/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-primary">{tab.name}</h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{tab.desc}</p>
                </div>
              ))}
            </div>

            {/* Screenshots */}
            <div className="space-y-5 pt-2">
              <ModernImageCard src="/documention/engagementtab.png" caption="Audited Expense Vouchers with Category & Committee Allocation" title="Expenses Ledger" tag="Financial Record" />
              <ModernImageCard src="/documention/engagementtabdonation.png" caption="Philanthropic Donations Ledger & Contributor Records" title="Donations Ledger" tag="Philanthropy" />
            </div>
          </section>

          {/* 11. Masters Configuration */}
          <section id="masters" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.masters.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.masters.title}</h2>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-surface-secondary/25 border border-border/80">
              {t.sections.masters.points.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            {/* Screenshots Stack */}
            <div className="space-y-5 pt-2">
              <ModernImageCard src="/documention/mastertab.png" caption="Master Data Hub: Horizontal Scroll Tab Bar" title="Master Hub Navigation" tag="10 Master Tables" />
              <ModernImageCard src="/documention/mastertabcountry.png" caption="Country Master: Global Nation Index" title="Country Master" tag="Geography" />
              <ModernImageCard src="/documention/mastertabstate.png" caption="State Master: Administrative State Registrations" title="State Master" tag="Geography" />
              <ModernImageCard src="/documention/mastertabcity.png" caption="City Master: Urban District Registrations" title="City Master" tag="Geography" />
              <ModernImageCard src="/documention/mastertabvillage.png" caption="Village Master: Ancestral Village Records" title="Village Master" tag="Geography" />
            </div>
          </section>

          {/* 12. Appearance & Brand Customizer */}
          <section id="settings" className="bg-surface border border-border/80 rounded-2xl p-7 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  {t.sections.settings.badge}
                </span>
                <h2 className="text-xl lg:text-2xl font-extrabold text-text mt-2.5">{t.sections.settings.title}</h2>
              </div>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-surface-secondary/25 border border-border/80">
              {t.sections.settings.points.map((p, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Floating Scroll to Top Button ── */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 z-40 p-3 rounded-2xl bg-primary text-white shadow-xl hover:bg-primary-hover border border-white/20 transition-all cursor-pointer group"
                title="Scroll to Top"
              >
                <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

      {/* ─── High-Definition Image Lightbox Modal ─── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-10 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl max-h-[92vh] w-full bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border/80 flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-surface-secondary/60 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-text font-bold text-sm">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>{lightboxImage.caption || 'UI Screenshot Preview'}</span>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-full hover:bg-surface-secondary text-text-secondary hover:text-text transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* High-Res Viewable Image */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/5">
                <img
                  src={lightboxImage.src}
                  alt="Enlarged screenshot"
                  className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-md"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-2.5 bg-surface border-t border-border flex items-center justify-between text-xs text-text-secondary">
                <span>Click outside or press Escape to dismiss</span>
                <span className="font-semibold text-primary">Parivar System Live Preview</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
