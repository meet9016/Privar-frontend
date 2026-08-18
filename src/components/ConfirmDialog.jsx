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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="relative mx-4 w-full max-w-sm rounded-[24px] border border-border bg-surface p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] animate-scale-in text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Icon Container */}
        <div className={`mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-error-bg shadow-[0_0_0_8px_rgba(239,68,68,0.1)]' : 'bg-primary-bg shadow-[0_0_0_8px_var(--color-primary-bg)]'}`}>
          <AlertTriangle className={`h-8 w-8 ${isDanger ? 'text-error' : 'text-primary'}`} strokeWidth={2.5} />
        </div>

        <h3 className="text-xl font-bold text-text mb-2 tracking-tight">Confirm Action</h3>
        <p className="text-sm text-text-secondary/90 leading-relaxed mb-8 px-2">{dialog.message}</p>

        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface-secondary text-text text-sm font-bold hover:bg-surface hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 shadow-sm hover:-translate-y-0.5 ${
              isDanger
                ? 'bg-error hover:bg-error-text shadow-error-glow'
                : 'bg-primary hover:bg-primary-hover shadow-glow-primary'
            }`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
