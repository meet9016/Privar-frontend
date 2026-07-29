import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { subscribeToToasts } from '../lib/toast'

const toastStyles = {
  error: {
    icon: AlertCircle,
    className: 'border-error-border bg-error-bg text-error-text shadow-glow-danger'
  },
  success: {
    icon: CheckCircle2,
    className: 'border-success-border bg-success-bg text-success-text shadow-sm'
  }
}

export default function ReactToaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribeToToasts((toast) => {
      if (!toast?.message) return

      setToasts((current) => [toast, ...current].slice(0, 4))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, toast.duration || 4000)
    })
  }, [])

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const config = toastStyles[toast.type] || toastStyles.success
        const Icon = config.icon

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm animate-fade-in backdrop-blur-md ${config.className}`}
            role="status"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1 font-medium leading-5">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
