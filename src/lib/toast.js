import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    return sonnerToast.success(text, {
      duration: 3500,
      ...options
    })
  },
  error: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    return sonnerToast.error(text, {
      duration: 4000,
      ...options
    })
  },
  info: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    return sonnerToast.info(text, {
      duration: 3500,
      ...options
    })
  },
  warning: (message, options = {}) => {
    const text = String(message || '').trim()
    if (!text) return
    return sonnerToast.warning(text, {
      duration: 3500,
      ...options
    })
  },
  loading: (message, options = {}) => sonnerToast.loading(message, options),
  dismiss: (id) => sonnerToast.dismiss(id)
}

export default toast

