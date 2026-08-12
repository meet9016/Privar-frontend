const TOAST_EVENT = 'parivar:toast'
const recentToasts = new Map()

export const emitToast = ({ type = 'success', message = '', duration = 4000 } = {}) => {
  const text = String(message || '').trim()
  if (!text || typeof window === 'undefined') return

  // Deduplicate identical toasts within a 2000ms window
  const key = `${type}:${text.toLowerCase()}`
  const now = Date.now()
  if (recentToasts.has(key) && now - recentToasts.get(key) < 2000) {
    return
  }
  recentToasts.set(key, now)

  // Clean up old entries
  if (recentToasts.size > 20) {
    for (const [k, time] of recentToasts.entries()) {
      if (now - time > 5000) recentToasts.delete(k)
    }
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      message: text,
      duration
    }
  }))
}

export const toast = {
  error: (message, options = {}) => emitToast({ ...options, type: 'error', message }),
  success: (message, options = {}) => emitToast({ ...options, type: 'success', message })
}

export const subscribeToToasts = (handler) => {
  if (typeof window === 'undefined') return () => {}

  const listener = (event) => handler(event.detail)
  window.addEventListener(TOAST_EVENT, listener)
  return () => window.removeEventListener(TOAST_EVENT, listener)
}

