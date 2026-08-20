import React from 'react'
import { Toaster } from 'sonner'

export default function ReactToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton={false}
      theme="light"
      toastOptions={{
        className: 'font-sans font-medium text-sm rounded-2xl shadow-glass border backdrop-blur-md',
        style: {
          padding: '12px 18px',
          fontSize: '13.5px',
          letterSpacing: '0.01em',
        }
      }}
    />
  )
}
