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

  const handleConfirm = useCallback(() => {
    resolveConfirm(true)
    setDialog(null)
  }, [])

  const handleCancel = useCallback(() => {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-glass-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isDanger ? 'bg-error-bg border border-error-border' : 'bg-primary/10 border border-primary/20'}`}>
            <AlertTriangle className={`h-5 w-5 ${isDanger ? 'text-error-text' : 'text-primary'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-text mb-1">Confirm Action</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{dialog.message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-border bg-surface-secondary text-text text-sm font-medium hover:bg-surface transition-colors"
          >
            {dialog.cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
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
