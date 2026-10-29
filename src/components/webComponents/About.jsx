import React, { useEffect, useState } from 'react'
import { Smartphone, Bell, Smile, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

const APP_SCREENS = [
  { src: '/Device-1.png', alt: 'Parivar App - Community Gallery', title: 'Community Gallery' },
  { src: '/Device.png', alt: 'Parivar App - Home Feed', title: 'Home & Community Feed' },
  { src: '/Device-2.png', alt: 'Parivar App - Events & Celebrations', title: 'Events & Registration' },
  { src: '/Device-4.png', alt: 'Parivar App - Family Directory', title: 'Family Directory' },
]

const APP_FEATURES = [
  {
    title: 'Easy Access',
    desc: 'All community features & members in one unified place',
    icon: Smartphone,
  },
  {
    title: 'Real-time Updates',
    desc: 'Instant push notifications for news, events & notices',
    icon: Bell,
  },
  {
    title: 'User Friendly',
    desc: 'Simple, clean & intuitive interface designed for all ages',
    icon: Smile,
  },
  {
    title: 'Secure & Private',
    desc: 'Verified member records with strict privacy protection',
    icon: ShieldCheck,
  },
]



export default function About() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [currentScreen, setCurrentScreen] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

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

  // Auto-cycle through screens smoothly every 3.2 seconds (pauses on hover)
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % APP_SCREENS.length)
    }, 3200)

    return () => clearInterval(timer)
  }, [isPaused])

  const handlePrevScreen = (e) => {
    e.stopPropagation()
    setCurrentScreen((prev) => (prev - 1 + APP_SCREENS.length) % APP_SCREENS.length)
  }

  const handleNextScreen = (e) => {
    e.stopPropagation()
    setCurrentScreen((prev) => (prev + 1) % APP_SCREENS.length)
  }

  const primaryColor = theme.primaryColor || '#991B1B'
  const textColor = theme.textColor || '#0a2342'
  const playStoreUrl = theme.android_app_link || theme.playstore_url || 'https://play.google.com/store/apps/details?id=com.digitalks.parivar'
  const appStoreUrl = theme.ios_app_link || theme.appstore_url || 'https://apps.apple.com'

  return (
    <section
      id="about"
      className="w-full py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-3xl p-6 sm:p-9 lg:p-12 transition-all duration-300 relative overflow-hidden shadow-sm"
          style={{
            background: `linear-gradient(145deg, #f8fafc 0%, #ffffff 45%, ${primaryColor}06 100%)`,
            border: `1.5px solid ${primaryColor}22`,
          }}
        >
          {/* Subtle Ambient Decorative Glows */}
          <div
            className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">

            {/* ================= LEFT COLUMN: Phone Mockup Showcase ================= */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div
                className="relative group cursor-pointer flex flex-col items-center"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Ambient Radial Halo behind Phone */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-96 rounded-full blur-2xl opacity-35 transition-all duration-500 group-hover:opacity-60 pointer-events-none"
                  style={{ backgroundColor: `${primaryColor}40` }}
                />

                {/* Phone Mockup Frame Container with Real Proportions */}
                <div className="relative w-[240px] sm:w-[270px] lg:w-[290px] h-[480px] sm:h-[530px] lg:h-[560px] flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                  {APP_SCREENS.map((screen, idx) => (
                    <img
                      key={screen.src}
                      src={screen.src}
                      alt={screen.alt}
                      className={`absolute inset-0 w-full h-full object-contain drop-shadow-2xl transition-all duration-700 ease-in-out select-none pointer-events-none ${
                        idx === currentScreen
                          ? 'opacity-100 scale-100 z-10'
                          : 'opacity-0 scale-95 z-0'
                      }`}
                    />
                  ))}

                  {/* Left Navigation Arrow */}
                  <button
                    type="button"
                    onClick={handlePrevScreen}
                    className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 text-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white transition-all duration-200 cursor-pointer border border-gray-200"
                    aria-label="Previous screen"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Right Navigation Arrow */}
                  <button
                    type="button"
                    onClick={handleNextScreen}
                    className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 text-gray-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white transition-all duration-200 cursor-pointer border border-gray-200"
                    aria-label="Next screen"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Screen Tag & Dot Indicators */}
                <div className="flex flex-col items-center gap-2.5 mt-3">
                  {/* Active Screen Tag */}
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border shadow-2xs transition-all duration-300"
                    style={{
                      color: primaryColor,
                      borderColor: `${primaryColor}30`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span>{APP_SCREENS[currentScreen]?.title}</span>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex items-center justify-center gap-1.5">
                    {APP_SCREENS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentScreen(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === currentScreen ? 'w-6 shadow-2xs' : 'w-2 bg-gray-300 hover:bg-gray-400'
                        }`}
                        style={i === currentScreen ? { backgroundColor: primaryColor } : {}}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: Info, Badges, Features ================= */}
            <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
              
              {/* Badge */}
              <div className="flex justify-center lg:justify-start mb-3">
                <div
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full border bg-white shadow-2xs"
                  style={{
                    color: primaryColor,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <Smartphone className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>Official Mobile App</span>
                </div>
              </div>

              {/* Heading */}
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-3"
                style={{ color: textColor }}
              >
                Download the Parivar App
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                Stay connected with your community members, get real-time event updates, explore registered businesses, and access family records anytime, anywhere from your phone.
              </p>

              {/* App Store Download Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-9">
                {/* Google Play Button */}
                <a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-black text-white shadow-md hover:bg-gray-900 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-neutral-800 group"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24" fill="none">
                    <path d="M3.6 2.4C3.2 2.8 3 3.4 3 4.2V19.8C3 20.6 3.2 21.2 3.6 21.6L3.7 21.7L13.8 12.1V11.9L3.7 2.3L3.6 2.4Z" fill="#2196F3" />
                    <path d="M17.2 15.5L13.8 12.1V11.9L17.2 8.5L17.3 8.6L21.3 10.9C22.4 11.5 22.4 12.5 21.3 13.1L17.3 15.4L17.2 15.5Z" fill="#FFC107" />
                    <path d="M17.3 15.4L13.8 12L3.6 21.7C4 22.1 4.7 22.2 5.5 21.7L17.3 15.4Z" fill="#F44336" />
                    <path d="M17.3 8.6L5.5 2.3C4.7 1.8 4 1.9 3.6 2.3L13.8 12L17.3 8.6Z" fill="#4CAF50" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-semibold tracking-wider uppercase text-gray-300">GET IT ON</div>
                    <div className="text-xs sm:text-sm font-bold tracking-tight">Google Play</div>
                  </div>
                </a>

                {/* App Store Button */}
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-black text-white shadow-md hover:bg-gray-900 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 border border-neutral-800 group"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 fill-current transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.56.64-1.06 1.7-0.92 2.73 1.01.08 2.03-.49 2.65-1.23z" />
                  </svg>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-semibold tracking-wider text-gray-300">Download on the</div>
                    <div className="text-xs sm:text-sm font-bold tracking-tight">App Store</div>
                  </div>
                </a>
              </div>

              {/* 4 Feature Cards */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-6 border-t"
                style={{ borderColor: `${primaryColor}18` }}
              >
                {APP_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={feature.title}
                      className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border transition-all duration-300 hover:shadow-xs hover:-translate-y-0.5"
                      style={{
                        borderColor: `${primaryColor}18`,
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${primaryColor}14`,
                          color: primaryColor,
                          border: `1px solid ${primaryColor}25`,
                        }}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">
                          {feature.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-gray-500 leading-snug">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
