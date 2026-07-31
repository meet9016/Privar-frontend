import React from 'react';
import { X } from 'lucide-react';
import FileDropzone from './FileDropzone';

export default function ImageUpload({ value, onChange, disabled, error, label = "Image (300x300 px, Max 1MB)" }) {
  const handleRemove = (e) => {
    e.preventDefault();
    onChange(null, true); // Pass true as second argument to indicate removal
  };

  const previewUrl = value instanceof File ? URL.createObjectURL(value) : value;

  return (
    <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
      {label && <label className="block text-sm font-semibold text-text-secondary mb-2">{label}</label>}

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
      
      {error && <p className="text-error-text text-sm mt-2 font-semibold">{error}</p>}
    </div>
  );
}
