import React, { useEffect, useState } from 'react'
import { Smartphone, Bell, Smile, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'

const APP_SCREENS = [
  { src: '/Device-1.png', fallback: '/1.png', alt: 'Parivar App - Gallery' },
  { src: '/Device.png', fallback: '/mobile.png', alt: 'Parivar App - Home Feed' },
  { src: '/Device-2.png', fallback: '/2.png', alt: 'Parivar App - Events' },
  { src: '/Device-4.png', fallback: '/3.png', alt: 'Parivar App - Directory' },
]

const APP_FEATURES = [
  {
    title: 'Easy Access',
    desc: ['All features in', 'one place'],
    icon: (color) => (
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-108 ring-3 ring-white/90"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Smartphone className="w-6 h-6 sm:w-6.5 sm:h-6.5" strokeWidth={2.2} />
      </div>
    ),
  },
  {
    title: 'Real-time Updates',
    desc: ['Get instant', 'notifications'],
    icon: (color) => (
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-108 ring-3 ring-white/90"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Bell className="w-6 h-6 sm:w-6.5 sm:h-6.5" strokeWidth={2.2} />
      </div>
    ),
  },
  {
    title: 'User Friendly',
    desc: ['Simple & clean', 'interface'],
    icon: (color) => (
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-108 ring-3 ring-white/90"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Smile className="w-6 h-6 sm:w-6.5 sm:h-6.5" strokeWidth={2.2} />
      </div>
    ),
  },
  {
    title: 'Secure & Reliable',
    desc: ['Your data is', 'safe with us'],
    icon: (color) => (
      <div
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-108 ring-3 ring-white/90"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <ShieldCheck className="w-6 h-6 sm:w-6.5 sm:h-6.5" strokeWidth={2.2} />
      </div>
    ),
  },
]

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
    'android_app_link',
    'playstore_url',
    'ios_app_link',
    'appstore_url',
  ]
  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

export default function About() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [currentScreen, setCurrentScreen] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    window.addEventListener('web-theme-updated', loadTheme)
    return () => {
      window.removeEventListener('storage', loadTheme)
      window.removeEventListener('web-theme-updated', loadTheme)
    }
  }, [])

  // Auto-carousel on hover: cycles through screens every 1.8 seconds while mouse is over phone
  useEffect(() => {
    if (!isHovered) return

    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % APP_SCREENS.length)
    }, 1800)

    return () => clearInterval(timer)
  }, [isHovered])

  const handleMouseEnter = () => {
    setIsHovered(true)
    // Advance to next screen immediately on hover for responsive feedback
    setCurrentScreen((prev) => (prev + 1) % APP_SCREENS.length)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handlePrevScreen = (e) => {
    e.stopPropagation()
    setCurrentScreen((prev) => (prev - 1 + APP_SCREENS.length) % APP_SCREENS.length)
  }

  const handleNextScreen = (e) => {
    e.stopPropagation()
    setCurrentScreen((prev) => (prev + 1) % APP_SCREENS.length)
  }

  const primaryColor = theme.primaryColor || '#991B1B'
  const playStoreUrl = theme.android_app_link || theme.playstore_url || 'https://play.google.com/store/apps/details?id=com.digitalks.parivar'
  const appStoreUrl = theme.ios_app_link || theme.appstore_url || 'https://apps.apple.com'

  return (
    <section
      id="about"
      className="w-full py-12 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        paddingTop: '64px',
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-5 sm:p-7 lg:py-8 lg:px-10 shadow-sm transition-all duration-300 relative"
          style={{
            backgroundColor: '#cbe1f74d',
            borderWidth: '1.5px',
            borderColor: theme.borderColor || '#E2E8F0',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

            {/* ================= LEFT COLUMN: Phone Mockup with Hover Carousel ================= */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <div
                className="relative w-[235px] sm:w-[260px] lg:w-[280px] h-[420px] sm:h-[455px] lg:h-[475px] group cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Phone Mockup Screen Stage with Cross-fade Transition */}
                <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-[1.02]">
                  {APP_SCREENS.map((screen, idx) => (
                    <img
                      key={screen.src}
                      src={screen.src}
                      alt={screen.alt}
                      onError={(e) => {
                        if (screen.fallback && e.target.src !== screen.fallback) {
                          e.target.src = screen.fallback
                        }
                      }}
                      className={`absolute inset-0 w-full h-full object-fill drop-shadow-2xl transition-all duration-700 ease-in-out select-none pointer-events-none ${idx === currentScreen
                        ? 'opacity-100 scale-100 z-10'
                        : 'opacity-0 scale-95 z-0'
                        }`}
                    />
                  ))}

                  {/* Left Navigation Arrow (shown on hover) */}
                  <button
                    type="button"
                    onClick={handlePrevScreen}
                    className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white transition-all duration-200 cursor-pointer"
                    aria-label="Previous screen"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Right Navigation Arrow (shown on hover) */}
                  <button
                    type="button"
                    onClick={handleNextScreen}
                    className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white transition-all duration-200 cursor-pointer"
                    aria-label="Next screen"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Screen Dot Indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  {APP_SCREENS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentScreen(i)}
                      onMouseEnter={() => setCurrentScreen(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentScreen ? 'w-5 shadow-sm' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                        }`}
                      style={i === currentScreen ? { backgroundColor: primaryColor } : {}}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: Header, Store Buttons & 4 Feature Icons ================= */}
            <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#0D1527] leading-tight mb-2">
                Download the Parivar.me App
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-5">
                Stay connected with your community anytime, anywhere.
              </p>

              {/* App Store Download Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-7">
                {/* Google Play Button */}
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-black text-white shadow-md hover:bg-gray-900 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3.6 2.4C3.2 2.8 3 3.4 3 4.2V19.8C3 20.6 3.2 21.2 3.6 21.6L3.7 21.7L13.8 12.1V11.9L3.7 2.3L3.6 2.4Z" fill="#2196F3" />
                    <path d="M17.2 15.5L13.8 12.1V11.9L17.2 8.5L17.3 8.6L21.3 10.9C22.4 11.5 22.4 12.5 21.3 13.1L17.3 15.4L17.2 15.5Z" fill="#FFC107" />
                    <path d="M17.3 15.4L13.8 12L3.6 21.7C4 22.1 4.7 22.2 5.5 21.7L17.3 15.4Z" fill="#F44336" />
                    <path d="M17.3 8.6L5.5 2.3C4.7 1.8 4 1.9 3.6 2.3L13.8 12L17.3 8.6Z" fill="#4CAF50" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] font-semibold tracking-wider uppercase text-gray-300">GET IT ON</div>
                    <div className="text-xs sm:text-sm font-bold tracking-tight">Google Play</div>
                  </div>
                </a>

                {/* App Store Button */}
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-black text-white shadow-md hover:bg-gray-900 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.56.64-1.06 1.7-0.92 2.73 1.01.08 2.03-.49 2.65-1.23z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[9px] font-semibold tracking-wider text-gray-300">Download on the</div>
                    <div className="text-xs sm:text-sm font-bold tracking-tight">App Store</div>
                  </div>
                </a>
              </div>

              {/* 4 Feature Items with Big Round Icons & 2-Line Descriptions */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-5 border-t"
                style={{ borderColor: theme.borderColor || '#E2E8F0' }}
              >
                {APP_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex flex-col items-center lg:items-start text-center lg:text-left group cursor-default"
                  >
                    <div className="mb-2.5">
                      {feature.icon(primaryColor)}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0D1527] mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-snug">
                      <span className="block">{Array.isArray(feature.desc) ? feature.desc[0] : feature.desc}</span>
                      <span className="block">{Array.isArray(feature.desc) ? feature.desc[1] : ''}</span>
                    </p>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

