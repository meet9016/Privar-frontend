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

    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        confirmText: options.confirmText || 'Delete',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger'
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
