import React, { useEffect, useState } from 'react'
import { CheckCircle, Heart, Home } from 'lucide-react'



const features = [
  'Bring Every Generation Onto One Private Space',
  'Plan Events, Share Photos & Preserve Memories',
  'Designed With Privacy & Warmth At Its Core',
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

export default function About() {
  const [theme, setTheme] = useState({})

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  return (
    <section
      id="about"
      className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
    >
      {/* Dynamic Background Glowing Orbs */}
      {/* <div
        className="absolute top-0 left-0 w-[24rem] h-[24rem] rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-[pulse_8s_ease-in-out_infinite] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: theme.primaryColor }}
      />
      <div
        className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-[pulse_10s_ease-in-out_infinite_reverse] pointer-events-none translate-x-1/3 translate-y-1/3"
        style={{ backgroundColor: theme.secondaryColor || theme.primaryColor }}
      /> */}

      <div className="max-w-7xl mx-auto grid items-center gap-8 lg:grid-cols-2 lg:gap-12 relative z-10">
        <div className="flex justify-center lg:justify-start group">
          <div className="relative w-[280px] sm:w-[320px] lg:w-[400px]">
            {/* Pulsing Backglow */}
            {/* <div
              className="absolute -inset-4 rounded-[3rem] opacity-20 group-hover:opacity-40 transition-all duration-1000 blur-2xl animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
              style={{ backgroundColor: theme.primaryColor }}
            /> */}
            {/* Floating Image Animation without shadow */}
            <div className="relative transform transition-transform duration-[2000ms] ease-out group-hover:-translate-y-2">
              <img
                src="/mobile.png"
                alt="mobile app"
                className="relative w-full h-auto object-contain"
                loading="lazy"
                style={{
                  animation: 'float 6s ease-in-out infinite'
                }}
              />
              {/* <style>{`
                @keyframes float {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-10px); }
                  100% { transform: translateY(0px); }
                }
              `}</style> */}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border backdrop-blur-md bg-white/60 self-start transition-all hover:scale-105"
            style={{ color: theme.primaryColor, borderColor: `${theme.primaryColor}30` }}
          >
            <Home className="h-4 w-4 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>About Parivar</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-4xl font-bold  tracking-tight mb-3"
            style={{ color: theme.textColor }}
          >
            Built For Families.<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor || shadeColor(theme.primaryColor, 30)})` }}>
              Designed For Togetherness.
            </span>
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed mb-5 font-medium"
            style={{ color: '#000000' }}
          >
            Parivar is a warm, modern community platform that helps families and groups stay beautifully connected, combining elegant design with the joy of being together across every generation.
          </p>

          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div
                key={feature}
                className="group/feature flex items-center gap-4 p-2 rounded-2xl transition-all duration-300 hover:bg-white/80 hover:-translate-y-0.5 backdrop-blur-sm border border-transparent hover:border-white/50"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div
                  className="flex-shrink-0 p-2.5 rounded-xl transition-transform duration-300 group-hover/feature:scale-110 group-hover/feature:rotate-6"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: theme.primaryColor }}
                  />
                </div>
                <span className="font-semibold text-sm sm:text-base tracking-tight" style={{ color: '#000000' }}>
                  {feature.replace(' 2020', '')}
                </span>
              </div>
            ))}
          </div>

          <a
            href="#members"
            className="mt-5 group inline-flex w-max items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold transition-all duration-500 hover:-translate-y-1 overflow-hidden relative"
            style={{
              backgroundColor: theme.buttonColor || theme.primaryColor,
              color: theme.fontColor,
            }}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
            <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:text-red-300" />
            <span className="relative z-10">Join Parivar</span>
            <style>{`
              @keyframes shimmer {
                100% { transform: translateX(150%); }
              }
            `}</style>
          </a>
        </div>
      </div>
    </section>
  )
}
