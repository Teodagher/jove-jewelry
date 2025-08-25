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
  Image as ImageIcon,
  Zap,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { compressImage, generateOptimizedFileName, formatFileSize as formatSize } from '@/lib/imageCompression';

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
  
  // Initialize Supabase client
  const supabase = createClient();

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

      // Compress image to WebP
      console.log('🗜️ Compressing image:', file.name, `(${formatSize(file.size)})`);
      
      const compressedBlob = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'webp'
      });

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
      const baseFileName = generateOptimizedFileName(file.name);
      const fileName = `${orderPrefix}-${baseFileName}`;

      // Upload compressed image
      const { error: uploadError } = await supabase.storage
        .from('website-pictures')
        .upload(`hero-pictures/${fileName}`, compressedBlob, {
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

      const { error } = await supabase.storage
        .from('website-pictures')
        .remove([`hero-pictures/${imageName}`]);

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
            .copy(`hero-pictures/${oldName}`, `hero-pictures/${newName}`);

          if (copyError) {
            console.error('Error copying file:', copyError);
            throw copyError;
          }

          // Delete old file
          const { error: deleteError } = await supabase.storage
            .from('website-pictures')
            .remove([`hero-pictures/${oldName}`]);

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
            Add images to your hero carousel. Images are automatically compressed to WebP format for optimal performance.
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
          <h2 className="text-lg font-medium text-gray-900">Current Hero Images</h2>
          <p className="mt-1 text-sm text-gray-600">
            {heroImages.length} image{heroImages.length !== 1 ? 's' : ''} in rotation
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
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-gray-100"
                          onClick={() => window.open(image.url, '_blank')}
                          disabled={reordering}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
          <h2 className="text-lg font-medium text-gray-900">Instructions & Optimization</h2>
        </div>
        <div className="p-6">
          <div className="prose prose-sm text-gray-600">
            <ul>
              <li><strong>Automatic Compression:</strong> All images are automatically compressed to WebP format with 85% quality for optimal loading speed.</li>
              <li><strong>Image Size:</strong> Images are resized to maximum 1920x1080px while maintaining aspect ratio.</li>
              <li><strong>Supported Formats:</strong> Upload JPEG, PNG, WebP, or AVIF files up to 50MB (before compression).</li>
              <li><strong>File Size Reduction:</strong> Typical compression savings are 30-70% smaller than original files.</li>
              <li><strong>Order:</strong> Images display in numbered order. Drag and drop to reorder the carousel sequence.</li>
              <li><strong>Performance Benefits:</strong> WebP format provides superior compression with excellent quality for faster page loads.</li>
              <li><strong>Backup:</strong> Always keep original copies of your images as backups since compression is irreversible.</li>
              <li><strong>Quality:</strong> Optimized for web display while maintaining professional visual quality for hero carousel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
