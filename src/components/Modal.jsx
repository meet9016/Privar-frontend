import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, title, children, onClose, maxWidth = 'max-w-4xl' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Panel */}
      <div className={`relative bg-surface border border-border rounded-2xl shadow-glass-lg w-full ${maxWidth} max-h-[96vh] text-text flex flex-col animate-scale-in z-10 my-auto`}>
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-surface-secondary/50 rounded-t-2xl">
          <h2 className="text-sm sm:text-base font-semibold text-text tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-3.5 sm:p-4 rounded-b-2xl overflow-y-auto overflow-x-visible custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
