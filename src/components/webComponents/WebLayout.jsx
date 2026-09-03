import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowUp, BookOpen, Sparkles } from 'lucide-react'
import WebHeader from './WebHeader'
import WebFooter from './WebFooter'
import { useWebTheme } from '../../hooks/useWebTheme'

export default function WebLayout() {
  useWebTheme()
  const location = useLocation()
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Scroll to top automatically when navigating between pages/routes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname, location.search])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between w-full relative">
      <WebHeader />
      <main className="flex-1 w-full animate-fade-in">
        <Outlet />
      </main>
      <WebFooter />

      {/* Custom Keyframe for Left Center Subtle Float */}
      <style>{`
        @keyframes floatLeftSubtle {
          0%, 100% {
            transform: translateY(-50%) translateX(0px);
          }
          50% {
            transform: translateY(-50%) translateX(5px);
          }
        }
      `}</style>

      {/* Expandable Left Center Floating Tutorial & Guide Dock Badge (Icon-Only Default, Text on Hover) */}
      {/* <Link
        to="/documentation"
        className="fixed top-1/2 left-3 z-50 group flex items-center p-2 rounded-full text-white shadow-2xl transition-all duration-500 ease-out hover:scale-108 hover:translate-x-1 border-2 border-white/80 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${localStorage.getItem('web_primaryColor') || '#0a2342'}, ${localStorage.getItem('web_secondaryColor') || '#4f46e5'})`,
          animation: 'floatLeftSubtle 3.5s ease-in-out infinite',
        }}
        title="Tutorial & Guide"
      >
        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md group-hover:rotate-12 group-hover:scale-105 transition-all duration-300">
          <BookOpen className="w-5 h-5" style={{ color: localStorage.getItem('web_primaryColor') || '#0a2342' }} />
        </div>
        <div className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-500 ease-out overflow-hidden whitespace-nowrap">
          <span className="text-xs sm:text-sm font-black text-white tracking-wide pl-3 pr-3">
            ✨ Tutorial & Guide
          </span>
        </div>
      </Link> */}

      {/* Floating Scroll to Top Arrow Button (Right Side Bottom) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/30 cursor-pointer"
          style={{
            backgroundColor: localStorage.getItem('web_primaryColor') || '#0a2342',
            color: localStorage.getItem('web_fontColor') || '#FFFFFF',
          }}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
