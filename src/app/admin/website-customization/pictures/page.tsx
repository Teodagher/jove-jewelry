'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff,
  Move,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface HeroImage {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

export default function PicturesManagementPage() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load hero images from Supabase
  const loadHeroImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.storage
        .from('website-pictures')
        .list('hero-pictures', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('Error loading images:', error);
        
        // If folder doesn't exist, create it
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          console.log('Creating hero-pictures folder...');
          try {
            const { error: uploadError } = await supabase.storage
              .from('website-pictures')
              .upload('hero-pictures/.keep', new Blob([''], { type: 'text/plain' }));
            
            if (!uploadError) {
              console.log('Folder created, retrying...');
              // Retry loading after creating folder
              const { data: retryData, error: retryError } = await supabase.storage
                .from('website-pictures')
                .list('hero-pictures', {
                  limit: 100,
                  sortBy: { column: 'created_at', order: 'asc' }
                });
              
              if (!retryError && retryData) {
                const imageFiles = retryData
                  ?.filter(file => {
                    if (file.name.startsWith('.')) return false;
                    const extension = file.name.toLowerCase().split('.').pop();
                    return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '');
                  })
                  .map(file => {
                    const { data: urlData } = supabase.storage
                      .from('website-pictures')
                      .getPublicUrl(`hero-pictures/${file.name}`);
                    
                    return {
                      name: file.name,
                      url: urlData.publicUrl,
                      size: file.metadata?.size || 0,
                      lastModified: file.updated_at || file.created_at || ''
                    };
                  }) || [];
                
                setHeroImages(imageFiles);
                return;
              }
            }
          } catch (folderError) {
            console.error('Error creating folder:', folderError);
          }
        }
        
        setError('Failed to load images from storage. Please check your connection and try again.');
        return;
      }

      // Filter only image files and create image objects
      const imageFiles = data
        ?.filter(file => {
          // Skip hidden files like .keep
          if (file.name.startsWith('.')) return false;
          
          const extension = file.name.toLowerCase().split('.').pop();
          return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '');
        })
        .map(file => {
          const { data: urlData } = supabase.storage
            .from('website-pictures')
            .getPublicUrl(`hero-pictures/${file.name}`);
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at || file.created_at || ''
          };
        }) || [];

      setHeroImages(imageFiles);
    } catch (err) {
      console.error('Error in loadHeroImages:', err);
      setError('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  };

  // Upload new image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or AVIF)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('website-pictures')
        .upload(`hero-pictures/${fileName}`, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload image');
        return;
      }

      setSuccess('Image uploaded successfully!');
      await loadHeroImages(); // Reload images
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleImageDelete = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      setError(null);

      const { error } = await supabase.storage
        .from('website-pictures')
        .remove([`hero-pictures/${imageName}`]);

      if (error) {
        console.error('Delete error:', error);
        setError('Failed to delete image');
        return;
      }

      setSuccess('Image deleted successfully!');
      await loadHeroImages(); // Reload images
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    loadHeroImages();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
              Hero Carousel Pictures
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage the images that appear in your homepage hero carousel.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto pl-3"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto pl-3"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upload New Image</h2>
          <p className="mt-1 text-sm text-gray-600">
            Add images to your hero carousel. Recommended size: 1920x1080px or larger.
          </p>
        </div>
        <div className="p-6">
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-zinc-600 hover:text-zinc-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-zinc-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WebP, AVIF up to 10MB</p>
              {uploading && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Hero Images</h2>
          <p className="mt-1 text-sm text-gray-600">
            {heroImages.length} image{heroImages.length !== 1 ? 's' : ''} in rotation
          </p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
          </div>
        ) : heroImages.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
            <p className="mt-1 text-sm text-gray-500">Upload your first hero image to get started.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {heroImages.map((image) => (
                <div key={image.name} className="group relative">
                  <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-48 w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-gray-100"
                          onClick={() => window.open(image.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-red-50 text-red-600"
                          onClick={() => handleImageDelete(image.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(image.size)}</span>
                      <span>{new Date(image.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Instructions</h2>
        </div>
        <div className="p-6">
          <div className="prose prose-sm text-gray-600">
            <ul>
              <li><strong>Image Size:</strong> Recommended minimum size is 1920x1080px for best quality on all devices.</li>
              <li><strong>Format:</strong> JPEG, PNG, WebP, or AVIF formats are supported.</li>
              <li><strong>File Size:</strong> Maximum file size is 10MB per image.</li>
              <li><strong>Order:</strong> Images are displayed in the order they were uploaded (oldest first).</li>
              <li><strong>Performance:</strong> Images are automatically optimized for web display.</li>
              <li><strong>Backup:</strong> Always keep original copies of your images as backups.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
