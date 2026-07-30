import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, title, children, onClose, maxWidth = 'max-w-4xl' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 my-2">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in" 
          aria-hidden="true"
        />
        
        {/* Modal Panel */}
        <div className={`relative bg-surface border border-border rounded-2xl shadow-glass-lg w-full ${maxWidth} max-h-[90vh] text-text flex flex-col animate-scale-in`}>
          <div className="flex-shrink-0 flex items-center justify-between gap-4 p-5 border-b border-border bg-surface-secondary/50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-text tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 rounded-b-2xl custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
