import React from 'react'

export default function Loader({ fullScreen = false, text = "Loading..." }) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-5 p-7 bg-surface/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-glass-xl max-w-xs w-full mx-4 animate-scale-in">
      <div className="relative flex items-center justify-center w-20 h-20">
        {/* Glowing background aura */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-slow"></div>
        
        {/* Triple Orbit rings */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary border-r-primary animate-spin"></div>
        <div className="absolute inset-1.5 rounded-full border-2 border-primary/15 border-b-primary border-l-primary animate-[spin_1.5s_reverse_infinite]"></div>
        <div className="absolute inset-3.5 rounded-full border-2 border-primary/10 border-t-primary/80 animate-[spin_2.5s_linear_infinite]"></div>
        
        {/* Core pulsing glowing dot */}
        <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-glow-primary animate-ping opacity-75"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow-primary relative z-10"></div>
      </div>

      {text && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-text font-bold tracking-wider text-xs uppercase">
            {text}
          </span>
          <div className="flex gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        {loaderContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[220px] animate-fade-in p-4">
      {loaderContent}
    </div>
  )
}
