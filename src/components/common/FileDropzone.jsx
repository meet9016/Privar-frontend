import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Modal from '../Modal';

export default function FileDropzone({
  onFilesSelected,
  multiple = false,
  accept = "*",
  disabled = false,
  label = "Drag & Drop or Click to Browse",
  subLabel = "",
  name = "",
  error = "",
  previews = [] // Array of { url: string, onRemove: function }
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let files = Array.from(e.dataTransfer.files);
      if (!multiple) files = [files[0]];
      onFilesSelected(files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasPreviews = previews && previews.length > 0;

  return (
    <div className="w-full">
      <div
        onClick={(e) => {
          if (e.target.closest('.preview-action-btn')) return;
          if (!disabled) fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full ${multiple ? 'min-h-36' : 'h-40'} rounded-2xl border border-dashed flex flex-col overflow-hidden cursor-pointer transition-all duration-300
          ${error ? 'border-red-500 bg-red-500/5' : isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-input-bg hover:bg-surface-secondary/40'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {hasPreviews ? (
          multiple ? (
            <div className="flex flex-col h-full p-2.5">
              <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto custom-scrollbar">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group/preview w-16 h-16 rounded-xl overflow-hidden border border-border bg-surface shrink-0">
                    {preview.url.endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-surface-secondary text-text">
                        <FileText className="w-5 h-5 text-primary mb-0.5" />
                        <span className="text-[9px] font-medium truncate max-w-full">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={preview.url}
                        alt="Preview"
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onClick={() => setFullscreenImage(preview.url)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        preview.onRemove();
                      }}
                      className="preview-action-btn absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors z-10 cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-center pt-2 border-t border-dashed border-border/60 mt-1">
                <p className="text-xs text-text-secondary flex items-center justify-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-primary" /> Click or drag to add more
                </p>
              </div>
            </div>
          ) : (
            /* Single Image Preview: Fill the whole box beautifully! */
            <div className="relative w-full h-full group/single overflow-hidden bg-surface-secondary/30">
              {previews[0].url.endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-text">
                  <FileText className="w-10 h-10 text-primary mb-1" />
                  <span className="text-xs font-semibold truncate max-w-[80%]">PDF Document</span>
                </div>
              ) : (
                <img
                  src={previews[0].url}
                  alt="Preview"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/single:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenImage(previews[0].url);
                  }}
                />
              )}
              
              {/* Top-right delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previews[0].onRemove();
                }}
                className="preview-action-btn absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110 z-20 cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Bottom replace overlay on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-1.5 px-3 flex items-center justify-center gap-1.5 text-white text-xs font-medium opacity-90 transition-opacity">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Click or drag to replace</span>
              </div>
            </div>
          )
        ) : (
          /* Empty state — centered upload prompt */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={`p-2.5 rounded-2xl mb-1.5 ${isDragOver ? 'bg-primary/20' : 'bg-surface shadow-sm border border-border'}`}>
              <UploadCloud className={`w-5 h-5 ${isDragOver ? 'text-primary' : 'text-text-secondary'}`} />
            </div>
            <p className="text-xs font-semibold text-text mb-0.5">{label}</p>
            {subLabel && <p className="text-[10px] text-text-secondary">{subLabel}</p>}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          multiple={multiple}
          accept={accept}
          className="hidden"
          disabled={disabled}
          name={name}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}

      {/* Fullscreen image preview lightbox */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] bg-surface rounded-2xl border border-border shadow-glass-xl p-3 flex flex-col items-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-border">
              <span className="text-sm font-semibold text-text">Image Preview</span>
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center overflow-hidden rounded-xl max-h-[70vh]">
              <img src={fullscreenImage} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
