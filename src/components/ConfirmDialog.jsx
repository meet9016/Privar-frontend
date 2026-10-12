import React, { useEffect, useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { subscribeToConfirm, resolveConfirm } from '../lib/confirm'

export default function ConfirmDialog() {
  const [dialog, setDialog] = useState(null)

  useEffect(() => {
    return subscribeToConfirm((detail) => {
      if (!detail?.message) return
      setDialog(detail)
    })
  }, [])

  const handleConfirm = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resolveConfirm(true)
    setDialog(null)
  }, [])

  const handleCancel = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resolveConfirm(false)
    setDialog(null)
  }, [])

  useEffect(() => {
    if (!dialog) return
    const handleKey = (e) => {
      if (e.key === 'Escape') handleCancel()
      if (e.key === 'Enter') handleConfirm()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dialog, handleCancel, handleConfirm])

  if (!dialog) return null

  const isDanger = dialog.type === 'danger'

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={handleCancel}
    >
      <div
        className="relative mx-auto w-full max-w-sm rounded-[24px] border border-border bg-surface p-7 shadow-2xl animate-scale-in text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Icon Container */}
        <div className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
          isDanger 
            ? 'bg-rose-500/15 text-rose-600 ring-8 ring-rose-500/10' 
            : 'bg-primary/15 text-primary ring-8 ring-primary/10'
        }`}>
          <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
        </div>

        <h3 className="text-lg font-bold text-text mb-2 tracking-tight">Confirm Action</h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-6 px-1">{dialog.message}</p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-text text-xs font-bold hover:bg-surface hover:shadow-xs transition-all cursor-pointer"
          >
            {dialog.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-primary hover:bg-primary-hover shadow-primary/30'
            }`}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
