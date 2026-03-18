'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageSelect: (base64: string, file: File) => void;
  currentImage?: string | null;
  onClear?: () => void;
}

export default function UploadZone({ onImageSelect, currentImage, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageSelect(base64, file);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  if (currentImage) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-zinc-100 border-2 border-zinc-200">
        <img
          src={currentImage}
          alt="Reference image"
          className="w-full h-auto max-h-[400px] object-contain"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          {onClear && (
            <button
              onClick={onClear}
              className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              title="Remove image"
            >
              <X className="w-5 h-5 text-zinc-700" />
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <p className="text-white text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Reference Image Loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative rounded-xl border-2 border-dashed transition-all duration-200
        ${isDragging 
          ? 'border-amber-500 bg-amber-50' 
          : 'border-zinc-300 hover:border-amber-400 hover:bg-zinc-50'
        }
      `}
    >
      <label className="flex flex-col items-center justify-center p-12 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="sr-only"
        />
        
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
          ${isDragging ? 'bg-amber-100' : 'bg-zinc-100'}
        `}>
          <Upload className={`w-8 h-8 ${isDragging ? 'text-amber-600' : 'text-zinc-400'}`} />
        </div>
        
        <p className="text-lg font-medium text-zinc-700 mb-1">
          {isDragging ? 'Drop image here' : 'Upload Reference Image'}
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          Drag & drop or click to browse
        </p>
        <p className="text-xs text-zinc-400">
          PNG, JPG, WEBP up to 10MB
        </p>
        
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </p>
        )}
      </label>
    </div>
  );
}
