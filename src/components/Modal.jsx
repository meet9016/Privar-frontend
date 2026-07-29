import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null


  return (

    <div className="fixed inset-x-0 bottom-0 top-[55px] bg-black/40 backdrop-blur-sm flex items-stretch justify-end z-50 my-2 py-4">  <div className="bg-surface border border-border rounded-l-3xl shadow-glass-lg w-3/4 overflow-hidden text-text flex flex-col p-6">
      <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-text tracking-tight">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-secondary transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
    </div>
  )
}
