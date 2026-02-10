'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff,
  Move,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Zap,
  GripVertical,
  Sparkles,
  Monitor,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { formatFileSize as formatSize } from '@/lib/imageCompression';
import imageCompression from 'browser-image-compression';
import { 
  fetchHeroImagesVisibility, 
  saveHeroImagesVisibility,
  type Visibility 
} from '@/services/heroImageService';

type Theme = 'original' | 'valentines';

interface HeroImage {
  name: string;
  url: string;
  size: number;
  lastModified: string;
  visibility: Visibility;
}

const themeLabels: Record<Theme, string> = {
  original: 'Original Theme',
  valentines: 'Valentine\'s Theme',
};

const themeIcons: Record<Theme, string> = {
  original: '🎨',
  valentines: '💝',
};

export default function PicturesManagementPage() {
  const [theme, setTheme] = useState<Theme>('original');
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    savings: number;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, Visibility>>({});
  const [savingVisibility, setSavingVisibility] = useState<string | null>(null);
  const [openVisibilityMenu, setOpenVisibilityMenu] = useState<string | null>(null);
  
  // Initialize Supabase client

  // Fetch current theme on mount
  useEffect(() => {
    fetchCurrentTheme();
  }, []);

  // Load hero images when theme changes
  useEffect(() => {
    if (theme) {
      loadHeroImages();
      loadVisibilitySettings();
    }
  }, [theme]);

  const fetchCurrentTheme = async () => {
    try {
      const response = await fetch('/api/admin/site-style');
      if (response.ok) {
        const data = await response.json();
        if (data.style && ['original', 'valentines'].includes(data.style)) {
          setTheme(data.style as Theme);
        }
      }
    } catch (e) {
      console.error('Error fetching theme:', e);
    }
  };

  const switchTheme = async (newTheme: Theme) => {
    if (newTheme === theme) return;
    
    setThemeLoading(true);
    try {
      const response = await fetch('/api/admin/site-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: newTheme }),
      });

      if (response.ok) {
        setTheme(newTheme);
        setSuccess(`Switched to ${themeLabels[newTheme]}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to switch theme');
      }
    } catch (e) {
      console.error('Error switching theme:', e);
      setError('Failed to switch theme');
    } finally {
      setThemeLoading(false);
    }
  };

  const getThemeFolder = () => `hero-pictures/${theme}`;

  // Load hero images from Supabase
  const loadHeroImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const folderPath = getThemeFolder();

      const { data, error } = await supabase.storage
        .from('website-pictures')
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('Error loading images:', error);
        
        // If folder doesn't exist, create it
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          console.log(`Creating ${folderPath} folder...`);
          try {
            const { error: uploadError } = await supabase.storage
              .from('website-pictures')
              .upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }));
            
            if (!uploadError) {
              console.log('Folder created, retrying...');
              // Retry loading after creating folder
              const { data: retryData, error: retryError } = await supabase.storage
                .from('website-pictures')
                .list(folderPath, {
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
                      .getPublicUrl(`${folderPath}/${file.name}`);
                    
                    // Get visibility from map, default to 'both'
                    const visibility = visibilityMap[file.name] || 'both';
                    
                    return {
                      name: file.name,
                      url: urlData.publicUrl,
                      size: file.metadata?.size || 0,
                      lastModified: file.updated_at || file.created_at || '',
                      visibility
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
            .getPublicUrl(`${folderPath}/${file.name}`);
          
          // Get visibility from map, default to 'both'
          const visibility = visibilityMap[file.name] || 'both';
          
          return {
            name: file.name,
            url: urlData.publicUrl,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at || file.created_at || '',
            visibility
          };
        }) || [];

      setHeroImages(imageFiles);
    } catch (err) {
      console.error('Error in loadHeroImages:', err);
      setError('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  }, [theme, supabase, visibilityMap]);

  // Load visibility settings from site_settings
  const loadVisibilitySettings = useCallback(async () => {
    try {
      const settings = await fetchHeroImagesVisibility(theme);
      setVisibilityMap(settings);
    } catch (err) {
      console.error('Error loading visibility settings:', err);
    }
  }, [theme]);

  // Handle visibility change for an image
  const handleVisibilityChange = async (imageName: string, newVisibility: Visibility) => {
    try {
      setSavingVisibility(imageName);
      
      // Update local state
      const updatedMap = { ...visibilityMap, [imageName]: newVisibility };
      setVisibilityMap(updatedMap);
      
      // Update hero images state
      setHeroImages(prev => prev.map(img => 
        img.name === imageName ? { ...img, visibility: newVisibility } : img
      ));
      
      // Save to database
      const success = await saveHeroImagesVisibility(theme, updatedMap);
      
      if (success) {
        setSuccess(`Visibility updated for ${imageName.replace(/^\d{3}-/, '')}`);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('Failed to save visibility setting');
      }
    } catch (err) {
      console.error('Error saving visibility:', err);
      setError('Failed to save visibility setting');
    } finally {
      setSavingVisibility(null);
    }
  };

  // Process file upload (from input or drag/drop)
  const processImageFile = async (file: File) => {

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or AVIF)');
      return;
    }

    // Validate file size (max 50MB before compression)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    try {
      setError(null);
      setCompressionInfo(null);
      setCompressing(true);

      // Compress image to WebP using browser-image-compression
      console.log('🗜️ Compressing image:', file.name, `(${formatSize(file.size)})`);
      
      const options = {
        maxSizeMB: 1, // Allow larger files for hero images (1MB)
        maxWidthOrHeight: 2560, // High quality for hero images
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.95,
        alwaysKeepResolution: false
      };

      const compressedBlob = await imageCompression(file, options);

      const originalSize = file.size;
      const compressedSize = compressedBlob.size;
      const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);

      setCompressionInfo({
        originalSize,
        compressedSize,
        savings
      });

      console.log('✅ Compression complete:', {
        original: formatSize(originalSize),
        compressed: formatSize(compressedSize),
        savings: `${savings}%`
      });

      setCompressing(false);
      setUploading(true);

      // Generate optimized file name with order prefix
      const nextOrderNumber = heroImages.length + 1;
      const orderPrefix = String(nextOrderNumber).padStart(3, '0');
      
      // Generate optimized filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const baseFileName = `${timestamp}-${cleanName}-${randomId}.webp`;
      
      const fileName = `${orderPrefix}-${baseFileName}`;

      // Upload compressed image to theme-specific folder
      const folderPath = getThemeFolder();
      const { error: uploadError } = await supabase.storage
        .from('website-pictures')
        .upload(`${folderPath}/${fileName}`, compressedBlob, {
          contentType: 'image/webp'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload compressed image');
        return;
      }

      setSuccess(`Image uploaded successfully! Compressed by ${savings}% (${formatSize(originalSize)} → ${formatSize(compressedSize)})`);
      await loadHeroImages(); // Reload images
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
        setCompressionInfo(null);
      }, 5000);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process and upload image');
    } finally {
      setCompressing(false);
      setUploading(false);
    }

  };

  // Upload new image with compression (from file input)
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
    
    // Clear the input
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag inactive when leaving the drop zone itself, not child elements
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (uploading || compressing) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (!imageFile) {
      setError('Please drop a valid image file');
      return;
    }

    await processImageFile(imageFile);
  };

  // Delete image
  const handleImageDelete = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      setError(null);

      const folderPath = getThemeFolder();
      const { error } = await supabase.storage
        .from('website-pictures')
        .remove([`${folderPath}/${imageName}`]);

      if (error) {
        console.error('Delete error:', error);
        setError('Failed to delete image. Please try again.');
        return;
      }

      setSuccess('Image deleted successfully!');
      await loadHeroImages(); // Reload images
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    }
  };

  // Use imported formatFileSize function as formatSize for consistency
  const formatFileSize = formatSize;

  // Reorder images by updating their names with order prefixes
  const reorderImages = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    try {
      setReordering(true);
      setError(null);

      // Create a new array with reordered items
      const reorderedImages = [...heroImages];
      const [movedImage] = reorderedImages.splice(fromIndex, 1);
      reorderedImages.splice(toIndex, 0, movedImage);

      // Update the local state immediately for better UX
      setHeroImages(reorderedImages);

      // Rename files in Supabase to reflect new order
      const folderPath = getThemeFolder();
      const renamePromises = reorderedImages.map(async (image, newIndex) => {
        const oldName = image.name;
        const orderPrefix = String(newIndex + 1).padStart(3, '0'); // 001, 002, etc.
        
        // Extract the original filename without any existing prefix
        const cleanName = oldName.replace(/^\d{3}-/, '');
        const newName = `${orderPrefix}-${cleanName}`;

        if (oldName !== newName) {
          // Copy file to new name
          const { error: copyError } = await supabase.storage
            .from('website-pictures')
            .copy(`${folderPath}/${oldName}`, `${folderPath}/${newName}`);

          if (copyError) {
            console.error('Error copying file:', copyError);
            throw copyError;
          }

          // Delete old file
          const { error: deleteError } = await supabase.storage
            .from('website-pictures')
            .remove([`${folderPath}/${oldName}`]);

          if (deleteError) {
            console.error('Error deleting old file:', deleteError);
            // Don't throw here as the copy succeeded
          }
        }
      });

      await Promise.all(renamePromises);
      
      // Reload images to get updated names and URLs
      await loadHeroImages();
      
      setSuccess('Images reordered successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error reordering images:', err);
      setError('Failed to reorder images');
      // Reload original order on error
      await loadHeroImages();
    } finally {
      setReordering(false);
    }
  };

  // Drag and drop handlers for reordering
  const handleReorderDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleReorderDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleReorderDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleReorderDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderImages(draggedIndex, dropIndex);
    }
  };

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

      {/* Theme Selector */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Active Theme</h2>
              <p className="text-sm text-gray-600">
                You are currently editing pictures for the <strong>{themeLabels[theme]}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Switch theme:</span>
            {(['original', 'valentines'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTheme(t)}
                disabled={themeLoading}
                className={`px-4 py-2 text-sm rounded-lg border transition-all flex items-center gap-2 ${
                  theme === t
                    ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300 hover:bg-pink-50'
                } ${themeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{themeIcons[t]}</span>
                {t === 'original' ? 'Original' : 'Valentine\'s'}
              </button>
            ))}
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
            Add high-quality images to your hero carousel. Images are automatically optimized to WebP format with minimal quality loss.
          </p>
        </div>
        <div className="p-6">
          <div 
            className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading || compressing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <Upload className={`mx-auto h-12 w-12 transition-colors ${
                dragActive ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-zinc-600 hover:text-zinc-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-zinc-500"
                >
                  <span>{dragActive ? 'Drop image here' : 'Upload a file'}</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                    onChange={handleImageUpload}
                    disabled={uploading || compressing}
                  />
                </label>
                {!dragActive && <p className="pl-1">or drag and drop</p>}
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WebP, AVIF up to 50MB (auto-compressed)</p>
              
              {/* Compression Progress */}
              {compressing && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Zap className="h-4 w-4 animate-pulse text-blue-600" />
                  <span className="text-sm text-gray-600">Compressing to WebP...</span>
                </div>
              )}
              
              {/* Upload Progress */}
              {uploading && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                  <span className="text-sm text-gray-600">Uploading compressed image...</span>
                </div>
              )}
              
              {/* Compression Info */}
              {compressionInfo && !uploading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Compression Complete</span>
                  </div>
                  <div className="mt-1 text-xs text-blue-700">
                    {formatFileSize(compressionInfo.originalSize)} → {formatFileSize(compressionInfo.compressedSize)} 
                    <span className="font-medium"> ({compressionInfo.savings}% smaller)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="jove-bg-card shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Hero Images — {themeLabels[theme]}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {heroImages.length} image{heroImages.length !== 1 ? 's' : ''} in rotation for {themeLabels[theme]}
            {heroImages.length > 1 && <span className="ml-2 text-blue-600">• Drag to reorder</span>}
          </p>
          {reordering && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Reordering images...</span>
            </div>
          )}
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
              {heroImages.map((image, index) => (
                <div 
                  key={image.name} 
                  className={`group relative cursor-move ${
                    draggedIndex === index ? 'opacity-50' : ''
                  } ${reordering ? 'pointer-events-none' : ''}`}
                  draggable={!reordering}
                  onDragStart={(e) => handleReorderDragStart(e, index)}
                  onDragEnd={handleReorderDragEnd}
                  onDragOver={handleReorderDragOver}
                  onDrop={(e) => handleReorderDrop(e, index)}
                >
                  {/* Order indicator and drag handle */}
                  <div className="absolute top-2 left-2 z-20 flex items-center space-x-1">
                    <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium">
                      #{index + 1}
                    </div>
                    {heroImages.length > 1 && (
                      <div className="bg-black/70 text-white p-1 rounded-full">
                        <GripVertical className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-200 border-2 border-transparent hover:border-blue-300 transition-colors">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="h-48 w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-gray-100"
                          onClick={() => window.open(image.url, '_blank')}
                          disabled={reordering}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Visibility Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenVisibilityMenu(openVisibilityMenu === image.name ? null : image.name);
                            }}
                            disabled={reordering || savingVisibility === image.name}
                            className={`p-2 rounded-md border text-sm font-medium transition-all flex items-center gap-1.5 bg-white hover:bg-gray-50 ${
                              image.visibility === 'both' ? 'border-green-300 text-green-700' :
                              image.visibility === 'desktop' ? 'border-blue-300 text-blue-700' :
                              'border-purple-300 text-purple-700'
                            } ${savingVisibility === image.name ? 'opacity-50 cursor-wait' : ''}`}
                            title="Change visibility"
                          >
                            {savingVisibility === image.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : image.visibility === 'both' ? (
                              <>
                                <Monitor className="h-3.5 w-3.5" />
                                <span className="text-xs">+</span>
                                <Smartphone className="h-3.5 w-3.5" />
                              </>
                            ) : image.visibility === 'desktop' ? (
                              <Monitor className="h-4 w-4" />
                            ) : (
                              <Smartphone className="h-4 w-4" />
                            )}
                          </button>
                          
                          {/* Visibility Menu */}
                          {openVisibilityMenu === image.name && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisibilityChange(image.name, 'both');
                                  setOpenVisibilityMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                                  image.visibility === 'both' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-0.5">
                                  <Monitor className="h-3.5 w-3.5" />
                                  <span className="text-xs">+</span>
                                  <Smartphone className="h-3.5 w-3.5" />
                                </div>
                                <span>Both</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisibilityChange(image.name, 'desktop');
                                  setOpenVisibilityMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                                  image.visibility === 'desktop' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <Monitor className="h-3.5 w-3.5" />
                                <span>Desktop only</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVisibilityChange(image.name, 'mobile');
                                  setOpenVisibilityMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                                  image.visibility === 'mobile' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                                }`}
                              >
                                <Smartphone className="h-3.5 w-3.5" />
                                <span>Mobile only</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-red-50 text-red-600"
                          onClick={() => handleImageDelete(image.name)}
                          disabled={reordering}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.name.replace(/^\d{3}-/, '')} {/* Remove order prefix from display */}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(image.size)}</span>
                      <span className={`font-medium ${
                        image.visibility === 'both' ? 'text-green-600' :
                        image.visibility === 'desktop' ? 'text-blue-600' :
                        'text-purple-600'
                      }`}>
                        {image.visibility === 'both' ? 'Desktop & Mobile' :
                         image.visibility === 'desktop' ? 'Desktop only' :
                         'Mobile only'}
                      </span>
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
          <h2 className="text-lg font-medium text-gray-900">Instructions & Optimization</h2>
        </div>
        <div className="p-6">
          <div className="prose prose-sm text-gray-600">
            <ul>
              <li><strong>High-Quality Compression:</strong> Images are compressed to WebP format with 95% quality for superior visual fidelity.</li>
              <li><strong>Image Size:</strong> Images are resized to maximum 2560x1440px (1440p) while maintaining aspect ratio.</li>
              <li><strong>Supported Formats:</strong> Upload JPEG, PNG, WebP, or AVIF files up to 50MB (before compression).</li>
              <li><strong>File Size Reduction:</strong> Typical compression savings are 20-50% smaller than original files with minimal quality loss.</li>
              <li><strong>Order:</strong> Images display in numbered order. Drag and drop to reorder the carousel sequence.</li>
              <li><strong>Device Visibility:</strong> Control which devices each image appears on — Desktop only, Mobile only, or Both. Click the device icons below each image to change visibility.</li>
              <li><strong>Performance Benefits:</strong> WebP format provides superior compression with excellent quality for faster page loads.</li>
              <li><strong>Backup:</strong> Always keep original copies of your images as backups since compression is irreversible.</li>
              <li><strong>Quality:</strong> Optimized for high-resolution displays while maintaining professional visual quality for hero carousel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
