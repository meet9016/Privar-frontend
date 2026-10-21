import { toast as sonnerToast } from 'sonner'

// Cache to prevent duplicate toasts firing in rapid succession
const recentToasts = new Map()

const isDuplicate = (type, text) => {
  const key = `${type}:${text}`
  const now = Date.now()
  if (recentToasts.has(key) && now - recentToasts.get(key) < 2000) {
    return true
  }
  recentToasts.set(key, now)

  // Prune map if large
  if (recentToasts.size > 50) {
    for (const [k, time] of recentToasts.entries()) {
      if (now - time > 5000) recentToasts.delete(k)
    }
  }
  return false
}

export const toast = {
  success: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text || isDuplicate('success', text)) return
    return sonnerToast.success(text, {
      id: options.id || text,
      duration: 3500,
      ...options
    })
  },
  error: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text || isDuplicate('error', text)) return
    return sonnerToast.error(text, {
      id: options.id || text,
      duration: 4000,
      ...options
    })
  },
  info: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text || isDuplicate('info', text)) return
    return sonnerToast.info(text, {
      id: options.id || text,
      duration: 3500,
      ...options
    })
  },
  warning: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text || isDuplicate('warning', text)) return
    return sonnerToast.warning(text, {
      id: options.id || text,
      duration: 3500,
      ...options
    })
  },
  loading: (message, options = {}) => sonnerToast.loading(message, options),
  dismiss: (id) => sonnerToast.dismiss(id)
}

export default toast

