'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface OptionImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null, file?: File) => void;
  optionName?: string;
  disabled?: boolean;
  mode?: 'immediate' | 'deferred'; // immediate uploads right away, deferred waits for save
}

export default function OptionImageUpload({ 
  currentImageUrl, 
  onImageChange, 
  optionName = 'option',
  disabled = false,
  mode = 'immediate'
}: OptionImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Public method to upload a file (for deferred mode)
  const uploadFile = async (file: File): Promise<string> => {
    return await uploadImage(file);
  };

  // Compress image to WebP format with target size < 15KB (ultra extreme compression)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Tiny dimensions for maximum compression
        const maxDimension = 150; // Reduced from 200 to 150 (even smaller)
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw with basic quality for maximum compression
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium'; // Reduced from 'high' to 'medium'
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Start with extremely low quality
        let quality = 0.3; // Start even lower
        const targetSize = 15000; // 15KB target (much smaller)
        const minQuality = 0.05; // Go to almost minimum quality
        
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            console.log(`Compression attempt: quality=${quality.toFixed(2)}, size=${blob.size} bytes`);

            // If under 15KB or quality is at minimum, use this version
            if (blob.size <= targetSize || quality <= minQuality) {
              console.log(`Final compressed image: ${blob.size} bytes (${(blob.size / 1024).toFixed(1)}KB)`);
              resolve(blob);
            } else {
              // Reduce quality extremely aggressively
              const sizeRatio = blob.size / targetSize;
              if (sizeRatio > 4) {
                quality -= 0.25; // Massive reduction if way over target
              } else if (sizeRatio > 3) {
                quality -= 0.2; // Huge reduction if way over target
              } else if (sizeRatio > 2) {
                quality -= 0.15; // Big reduction if over target
              } else if (sizeRatio > 1.5) {
                quality -= 0.1; // Medium reduction
              } else {
                quality -= 0.05; // Small reduction when close
              }
              
              tryCompress();
            }
          }, 'image/webp', quality);
        };

        tryCompress();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log('Starting image upload process...');
      
      // First, let's test bucket access
      console.log('Testing bucket access...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
      } else {
        console.log('Available buckets:', buckets?.map(b => b.id));
      }
      
      // Compress the image
      const compressedBlob = await compressImage(file);
      console.log('Image compressed, size:', compressedBlob.size, 'bytes');
      
      // Generate unique filename
      const fileExt = 'webp';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName; // Simplified path - just filename without subdirectory

      console.log('Uploading to bucket: customization_options, path:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('customization_options')
        .upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customization_options')
        .getPublicUrl(data.path);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for input
      alert('File size too large. Please select an image under 10MB');
      return;
    }

    if (mode === 'immediate') {
      // Upload immediately (existing behavior)
      setUploading(true);
      try {
        const imageUrl = await uploadImage(file);
        onImageChange(imageUrl);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    } else {
      // Deferred mode - just store the file and create a preview
      try {
        const compressedBlob = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedBlob);
        // Pass both the preview URL and the file for later upload
        onImageChange(previewUrl, file);
      } catch (error) {
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove image
  const removeImage = () => {
    // Clean up object URL if it exists
    if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentImageUrl);
    }
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Option Image
      </label>
      
      {currentImageUrl ? (
        // Show current image with remove option
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt={optionName}
            className="w-24 h-24 object-cover rounded-lg border border-gray-300"
          />
          {!disabled && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        // Upload area
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Compressing and uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                {dragOver ? (
                  <Upload className="w-6 h-6 text-blue-500" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {dragOver ? 'Drop image here' : 'Upload image'}
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB (will be compressed to WebP &lt; 15KB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Images are automatically compressed to WebP format under 15KB while maintaining quality
      </p>
    </div>
  );
}
