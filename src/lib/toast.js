const TOAST_EVENT = 'parivar:toast'

export const emitToast = ({ type = 'success', message = '', duration = 4000 } = {}) => {
  const text = String(message || '').trim()
  if (!text || typeof window === 'undefined') return

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
