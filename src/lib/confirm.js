const CONFIRM_EVENT = 'parivar:confirm'

let pendingResolve = null

export const confirm = (message = 'Are you sure?', options = {}) => {
  return new Promise((resolve) => {
    // If there's already a pending confirm, reject it
    if (pendingResolve) {
      pendingResolve(false)
      pendingResolve = null
    }

    pendingResolve = resolve

    let msg = message
    let opts = options
    if (typeof message === 'object' && message !== null) {
      msg = message.message || 'Are you sure?'
      opts = { ...message, ...options }
    }

    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: opts.title || 'Confirm Action',
        message: typeof msg === 'string' ? msg : 'Are you sure?',
        confirmText: opts.confirmText || 'Delete',
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || opts.variant || 'danger'
      }
    }))
  })
}

export const resolveConfirm = (result) => {
  if (pendingResolve) {
    pendingResolve(result)
    pendingResolve = null
  }
}

export const subscribeToConfirm = (handler) => {
  if (typeof window === 'undefined') return () => {}

  const listener = (event) => handler(event.detail)
  window.addEventListener(CONFIRM_EVENT, listener)
  return () => window.removeEventListener(CONFIRM_EVENT, listener)
}
