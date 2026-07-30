import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { assetUrl } from '../../lib/api'

export default function Loader({ fullScreen = false, text = "Loading..." }) {
  const { webTheme } = useContext(AuthContext) || {}
  
  // Try to grab logo from theme or use default image.png
  const logoSrc = webTheme?.webLogo ? assetUrl(webTheme.webLogo) : '/image.png'

  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-8 p-12">
      <div className="relative flex items-center justify-center group">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 bg-primary/20 blur-[32px] rounded-full animate-pulse-slow w-32 h-32 m-auto group-hover:bg-primary/30 transition-all duration-700"></div>
        {/* Animated borders */}
        <div className="absolute inset-0 border-[3px] border-primary/10 border-t-primary border-l-primary/50 rounded-full animate-spin w-28 h-28 m-auto shadow-[0_0_15px_rgba(var(--color-primary),0.3)]"></div>
        <div className="absolute inset-0 border-[3px] border-transparent border-b-secondary border-r-secondary/50 rounded-full animate-[spin_2s_reverse_infinite] w-24 h-24 m-auto"></div>
        {/* Logo */}
        <img 
          src={logoSrc} 
          alt="Loading..." 
          className="w-16 h-16 object-contain relative z-10 animate-pulse-slow drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] bg-white/10 rounded-2xl p-2 backdrop-blur-sm"
        />
      </div>
      {text && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-sm animate-pulse drop-shadow-md">
            {text}
          </span>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        {loaderContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px] animate-fade-in">
      {loaderContent}
    </div>
  )
}
