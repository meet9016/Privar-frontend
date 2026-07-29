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
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex justify-center lg:justify-start">
          <img
            src="/mobile.png"
            alt="mobile app"
            className="w-full max-w-md lg:max-w-lg object-contain"
            loading="lazy"
          />
        </div>

        <div>
          <p
            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold mb-4"
            style={{ color: theme.primaryColor }}
          >
            <Home className="h-4 w-4" />
            About   Parivar
          </p>

          <h2
            className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight"
            style={{ color: theme.textColor }}
          >
            Built For Families. Designed For Togetherness.
          </h2>

          <p
            className="mt-5 text-base leading-7"
            style={{ color: shadeColor(theme.textColor, 25) }}
          >
             Parivar is a warm, modern community platform that helps families and groups stay beautifully connected, combining elegant design with the joy of being together across every generation.
          </p>

          <div className="mt-7 divide-y" style={{ borderColor: theme.borderColor }}>
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 py-3">
                <CheckCircle
                  className="h-5 w-5 flex-shrink-0"
                  style={{ color: theme.primaryColor }}
                />
                <span className="font-semibold" style={{ color: theme.textColor }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <a
            href="#members"
            className="mt-8 inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: theme.buttonColor || theme.primaryColor,
              color: theme.fontColor,
            }}
          >
            <Heart className="h-4 w-4" />
            Join Parivar
          </a>
        </div>
      </div>
    </section>
  )
}
