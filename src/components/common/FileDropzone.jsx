import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { UploadCloud, X, FileText, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

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
        className={`relative w-full ${multiple ? 'min-h-[170px]' : 'h-44'} rounded-2xl border-2 border-dashed flex flex-col justify-center overflow-hidden cursor-pointer transition-all duration-300
          ${error ? 'border-red-500 bg-red-500/5' : isDragOver ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border bg-input-bg hover:border-primary/40 hover:bg-surface-secondary/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        {hasPreviews ? (
          multiple ? (
            <div className="flex flex-col h-full p-4 justify-between">
              <div className="flex flex-wrap gap-3 flex-1 overflow-y-auto custom-scrollbar max-h-36">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group/preview w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface shrink-0 shadow-sm">
                    {preview.url.endsWith('.pdf') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-surface-secondary text-text">
                        <FileText className="w-6 h-6 text-primary mb-1" />
                        <span className="text-[10px] font-semibold truncate max-w-full">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={preview.url}
                        alt="Preview"
                        draggable={false}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 select-none cursor-zoom-in"
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(preview.url); }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        preview.onRemove();
                      }}
                      className="preview-action-btn absolute top-1 right-1 bg-red-550/90 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-10 cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-center pt-3 border-t border-dashed border-border/60 mt-3">
                <p className="text-xs text-text-secondary flex items-center justify-center gap-1.5 font-medium">
                  <UploadCloud className="w-4 h-4 text-primary" /> Click or drag to add more
                </p>
              </div>
            </div>
          ) : (
            /* Single Image Preview: Fill the whole box beautifully! */
            <div className="relative w-full h-full group/single overflow-hidden bg-surface-secondary/20">
              {previews[0].url.endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-text">
                  <FileText className="w-12 h-12 text-primary mb-1" />
                  <span className="text-xs font-semibold truncate max-w-[85%]">PDF Document</span>
                </div>
              ) : (
                <img
                  src={previews[0].url}
                  alt="Preview"
                  draggable={false}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/single:scale-105 select-none"
                  onContextMenu={(e) => e.preventDefault()}
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
                className="preview-action-btn absolute top-2.5 right-2.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform hover:scale-110 z-20 cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Bottom replace overlay on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-2 px-3 flex items-center justify-center gap-1.5 text-white text-xs font-semibold opacity-90 transition-opacity">
                <UploadCloud className="w-4 h-4" />
                <span>Click or drag to replace</span>
              </div>
            </div>
          )
        ) : (
          /* Empty state — centered upload prompt */
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className={`p-3 rounded-2xl mb-2.5 transition-colors ${isDragOver ? 'bg-primary/20' : 'bg-surface shadow-sm border border-border'}`}>
              <UploadCloud className={`w-6 h-6 ${isDragOver ? 'text-primary' : 'text-text-secondary'}`} />
            </div>
            <p className="text-sm font-semibold text-text mb-0.5">{label}</p>
            {subLabel ? (
              <p className="text-xs text-text-secondary">{subLabel}</p>
            ) : (
              <p className="text-xs text-text-secondary">Upload multiple images. Existing images stay unless removed below.</p>
            )}
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

      {fullscreenImage && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          style={{ zIndex: 999999 }}
          onClick={() => setFullscreenImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-surface rounded-2xl border border-border shadow-2xl p-4 flex flex-col items-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 mb-3 border-b border-border">
              <span className="text-sm font-semibold text-text">Image Preview</span>
              <button
                type="button"
                onClick={() => setFullscreenImage(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center overflow-auto rounded-xl w-full max-h-[75vh]">
              <img
                src={fullscreenImage}
                alt="Preview"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm select-none"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
