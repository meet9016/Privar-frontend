import { toast as sonnerToast } from 'sonner'

// Memory cache to prevent duplicate / double toast messages
const recentToasts = new Map()
let lastErrorTime = 0
let lastErrorMessage = ''

/**
 * Checks if a toast message should be shown, preventing duplicate toasts
 * from rapid-fire events (e.g. Axios interceptor + Component catch block)
 */
const shouldShowToast = (type, message, cooldownMs = 2500, options = {}) => {
  if (options.allowDuplicate) return true

  const text = String(message || '').trim()
  if (!text) return false

  const now = Date.now()
  const key = `${type}:${text.toLowerCase()}`

  // For error toasts: Also suppress rapid-fire cascade (e.g. Axios interceptor + component catch block within 800ms)
  if (type === 'error') {
    // If exact same error message was fired within cooldownMs
    if (text === lastErrorMessage && now - lastErrorTime < cooldownMs) {
      return false
    }
    // If ANY error toast was fired within 800ms (interceptor + catch block cascade)
    if (now - lastErrorTime < 800) {
      return false
    }
    lastErrorTime = now
    lastErrorMessage = text
  }

  const lastTime = recentToasts.get(key)
  if (lastTime && now - lastTime < cooldownMs) {
    return false
  }

  recentToasts.set(key, now)

  // Periodic cleanup of older keys
  if (recentToasts.size > 50) {
    for (const [k, time] of recentToasts.entries()) {
      if (now - time > 15000) recentToasts.delete(k)
    }
  }

  return true
}

export const toast = {
  success: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    if (!shouldShowToast('success', text, options.cooldown || 2000, options)) return
    const id = options.id || `success-${text}`
    return sonnerToast.success(text, {
      duration: 3500,
      id,
      ...options
    })
  },
  error: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    if (!shouldShowToast('error', text, options.cooldown || 2500, options)) return
    const id = options.id || `error-${text}`
    return sonnerToast.error(text, {
      duration: 4000,
      id,
      ...options
    })
  },
  info: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    if (!shouldShowToast('info', text, options.cooldown || 2000, options)) return
    const id = options.id || `info-${text}`
    return sonnerToast.info(text, {
      duration: 3500,
      id,
      ...options
    })
  },
  warning: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    if (!shouldShowToast('warning', text, options.cooldown || 2000, options)) return
    const id = options.id || `warning-${text}`
    return sonnerToast.warning(text, {
      duration: 3500,
      id,
      ...options
    })
  },
  loading: (message, options = {}) => sonnerToast.loading(message, options),
  dismiss: (id) => sonnerToast.dismiss(id)
}

export default toast


