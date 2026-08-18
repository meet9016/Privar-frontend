import React from 'react';
import { X } from 'lucide-react';
import FileDropzone from './FileDropzone';

export default function ImageUpload({ value, onChange, disabled, error, label = "Image (300x300 px, Max 1MB)" }) {
  const handleRemove = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onChange(null, true); // Pass true as second argument to indicate removal
  };

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value;

  return (
    <div className="flex flex-col w-full h-full">
      {label && <label className="block text-sm font-semibold text-text-secondary mb-1.5">{label}</label>}

      <div className="flex-1 min-h-[160px] flex flex-col">
        <FileDropzone 
          accept="image/*"
          onFilesSelected={(files) => onChange(files[0])}
          disabled={disabled}
          label={previewUrl ? "Replace image" : "Click or Drag & Drop"}
          subLabel={!previewUrl ? "Select an image file to upload" : ""}
          previews={previewUrl ? [{
            url: previewUrl,
            onRemove: handleRemove
          }] : []}
        />
      </div>
      
      {error && <p className="text-error-text text-sm mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}
