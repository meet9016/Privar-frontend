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
      {/* Fixed-height container — never changes size */}
      <div
        onClick={(e) => {
          if (e.target.closest('.preview-item')) return;
          if (!disabled) fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full h-44 rounded-2xl border border-dashed flex flex-col overflow-hidden cursor-pointer transition-all duration-300
          ${error ? 'border-red-500 bg-red-500/5' : isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-input-bg hover:bg-surface-secondary/40'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {hasPreviews ? (
          /* When images exist: scrollable grid occupies top, compact upload strip at bottom */
          <div className="flex flex-col h-full">
            {/* Image grid — scrollable, fixed area */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-wrap gap-2">
                {previews.map((preview, idx) => (
                  <div key={idx} className="preview-item relative w-16 h-16 flex-shrink-0 group">
                    <img
                      src={preview.url}
                      alt="preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border shadow-sm cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImage(preview.url);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        preview.onRemove();
                      }}
                      className="preview-item absolute -top-1.5 -right-1.5 bg-error text-white rounded-full p-0.5 transition-opacity flex items-center justify-center shadow z-10"
                      title="Remove"
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Compact upload strip at bottom */}
            <div className={`flex items-center justify-center gap-2 px-4 py-2.5 border-t border-dashed ${isDragOver ? 'border-primary bg-primary/10' : 'border-border/60 bg-surface-secondary/30'} flex-shrink-0`}>
              <UploadCloud className={`w-4 h-4 flex-shrink-0 ${isDragOver ? 'text-primary' : 'text-text-secondary'}`} />
              <span className="text-xs font-semibold text-text-secondary truncate">
                {isDragOver ? 'Drop to add more' : multiple ? 'Click or drag to add more' : 'Click or drag to replace'}
              </span>
            </div>
          </div>
        ) : (
          /* Empty state — centered upload prompt */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={`p-3 rounded-xl mb-2.5 ${isDragOver ? 'bg-primary/20' : 'bg-surface shadow-sm border border-border'}`}>
              <UploadCloud className={`w-6 h-6 ${isDragOver ? 'text-primary' : 'text-text-secondary'}`} />
            </div>
            <p className="text-sm font-semibold text-text mb-0.5">{label}</p>
            {subLabel && <p className="text-xs text-text-secondary">{subLabel}</p>}
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

      {/* Fullscreen image preview modal */}
      <Modal
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        title="Image Preview"
        size="lg"
      >
        {fullscreenImage && (
          <div className="flex items-center justify-center bg-black/5 rounded-xl p-2 overflow-hidden h-[70vh]">
            <img src={fullscreenImage} alt="Preview" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
