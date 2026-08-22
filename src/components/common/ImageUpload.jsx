import React from 'react';
import FileDropzone from './FileDropzone';

export default function ImageUpload({
  value,
  onChange,
  disabled,
  error,
  label = "Image (300x300 px, Max 1MB)",
  heightClass = "h-[185px]",
  className = ""
}) {
  const handleRemove = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onChange(null, true); // Pass true as second argument to indicate removal
  };

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && <label className="block text-sm font-semibold text-text-secondary mb-1.5">{label}</label>}

      <div className={`w-full ${heightClass} flex flex-col overflow-hidden`}>
        <FileDropzone 
          accept="image/*"
          onFilesSelected={(files) => onChange(files[0])}
          disabled={disabled}
          label={previewUrl ? "Replace image" : "Click or Drag & Drop"}
          subLabel={!previewUrl ? "Select image (300x300 px)" : ""}
          className="h-full"
          previews={previewUrl ? [{
            url: previewUrl,
            onRemove: handleRemove
          }] : []}
        />
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}
