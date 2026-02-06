// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast-provider';
import { variantGenerator, type ProductVariant, type VariantGenerationResult } from '@/services/variantGenerator';
import { VariantImagesService, type VariantImage } from '@/services/variantImagesService';
import { formatFileSize } from '@/lib/imageCompression';
import imageCompression from 'browser-image-compression';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  ZoomIn,
  Plus,
  GripVertical,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
  Images
} from 'lucide-react';

interface ProductImagesGalleryProps {
  productId: string;
  productType: string;
  productSlug?: string;
  refreshTrigger?: number;
}

interface UploadStatus {
  [variantId: string]: {
    uploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
  };
}

interface VariantWithGallery extends ProductVariant {
  galleryImages: VariantImage[];
  galleryExpanded: boolean;
}

export default function ProductImagesGallery({ productId, productType, productSlug, refreshTrigger }: ProductImagesGalleryProps) {
  const [variants, setVariants] = useState<VariantWithGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VariantGenerationResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'exists' | 'missing' | 'gallery'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVariant, setSelectedVariant] = useState<VariantWithGallery | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverVariantId, setDragOverVariantId] = useState<string | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { addToast } = useToast();

  const generateVariants = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting variant generation for product:', productId, 'type:', productType);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Variant generation timed out')), 30000)
      );

      const variantPromise = variantGenerator.generateVariantsForProduct(productId, productType);
      const result = await Promise.race([variantPromise, timeoutPromise]) as VariantGenerationResult;
      
      // Fetch gallery images for each variant
      const variantsWithGallery: VariantWithGallery[] = await Promise.all(
        result.variants.map(async (variant) => {
          const variantKey = variant.filename.replace(/\.[^/.]+$/, '');
          const { directImages } = await VariantImagesService.getVariantImages(variantKey);
          return {
            ...variant,
            galleryImages: directImages,
            galleryExpanded: false
          };
        })
      );
      
      setVariants(variantsWithGallery);
      setStats(result);
      
      const galleryCount = variantsWithGallery.filter(v => v.galleryImages.length > 0).length;
      addToast({
        type: 'success',
        title: 'Variants Generated',
        message: `Found ${result.totalVariants} variants (${result.existingImages} with images, ${galleryCount} with galleries)`
      });
    } catch (error: any) {
      console.error('❌ Error generating variants:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate product variants'
      });
      setVariants([]);
      setStats({
        variants: [],
        totalVariants: 0,
        existingImages: 0,
        missingImages: 0
      });
    } finally {
      setLoading(false);
    }
  }, [productId, productType, refreshTrigger, addToast]);

  useEffect(() => {
    generateVariants();
  }, [productId, productType, refreshTrigger]);

  // Compress and upload image to gallery
  const handleGalleryUpload = async (variantId: string, files: FileList) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const variantKey = variant.filename.replace(/\.[^/.]+$/, '');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setUploadStatus(prev => ({
        ...prev,
        [variantId]: { uploading: true, progress: 0, error: null, success: false }
      }));

      try {
        // Compress image
        setUploadStatus(prev => ({
          ...prev,
          [variantId]: { ...prev[variantId], progress: 25 }
        }));

        const options = {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.9,
          alwaysKeepResolution: false
        };

        const compressedBlob = await imageCompression(file, options);

        setUploadStatus(prev => ({
          ...prev,
          [variantId]: { ...prev[variantId], progress: 50 }
        }));

        // Generate unique filename for gallery image
        const timestamp = Date.now();
        const galleryIndex = variant.galleryImages.length + i;
        const galleryFilename = `${variantKey}_gallery_${galleryIndex}_${timestamp}.webp`;
        const uploadPath = `${productType}s/gallery/${galleryFilename}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('customization-item')
          .upload(uploadPath, compressedBlob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (error) throw error;

        setUploadStatus(prev => ({
          ...prev,
          [variantId]: { ...prev[variantId], progress: 75 }
        }));

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('customization-item')
          .getPublicUrl(uploadPath);

        // Add to variant_images table
        const isPrimary = variant.galleryImages.length === 0 && i === 0;
        const newImage = await VariantImagesService.addVariantImage(
          variantKey,
          urlData.publicUrl,
          isPrimary
        );

        if (newImage) {
          // Update local state
          setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
              return {
                ...v,
                galleryImages: [...v.galleryImages, newImage],
                galleryExpanded: true
              };
            }
            return v;
          }));
        }

        setUploadStatus(prev => ({
          ...prev,
          [variantId]: { uploading: false, progress: 100, error: null, success: true }
        }));

        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: `Added to ${variant.name} gallery`
        });

      } catch (error: any) {
        console.error('Error uploading gallery image:', error);
        setUploadStatus(prev => ({
          ...prev,
          [variantId]: { uploading: false, progress: 0, error: error.message, success: false }
        }));
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: error.message
        });
      }
    }
  };

  // Delete gallery image
  const handleDeleteGalleryImage = async (variantId: string, image: VariantImage) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    try {
      await VariantImagesService.deleteVariantImageWithStorage(
        image.id,
        image.image_url,
        'customization-item'
      );

      // Update local state
      setVariants(prev => prev.map(v => {
        if (v.id === variantId) {
          return {
            ...v,
            galleryImages: v.galleryImages.filter(img => img.id !== image.id)
          };
        }
        return v;
      }));

      addToast({
        type: 'success',
        title: 'Image Deleted',
        message: 'Gallery image removed'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error.message
      });
    }
  };

  // Set primary image
  const handleSetPrimary = async (variantId: string, image: VariantImage) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const variantKey = variant.filename.replace(/\.[^/.]+$/, '');
    
    const success = await VariantImagesService.setPrimaryImage(variantKey, image.id);
    
    if (success) {
      setVariants(prev => prev.map(v => {
        if (v.id === variantId) {
          return {
            ...v,
            galleryImages: v.galleryImages.map(img => ({
              ...img,
              is_primary: img.id === image.id
            }))
          };
        }
        return v;
      }));

      addToast({
        type: 'success',
        title: 'Primary Image Set',
        message: 'This image will be shown first'
      });
    }
  };

  // Handle drag and drop reordering
  const handleDragStart = (imageId: string) => {
    setDraggedImageId(imageId);
  };

  const handleDragOver = (e: React.DragEvent, variantId: string) => {
    e.preventDefault();
    setDragOverVariantId(variantId);
  };

  const handleDrop = async (e: React.DragEvent, variantId: string, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedImageId) return;

    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const draggedIndex = variant.galleryImages.findIndex(img => img.id === draggedImageId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedImageId(null);
      setDragOverVariantId(null);
      return;
    }

    // Reorder locally
    const newImages = [...variant.galleryImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    // Update local state immediately
    setVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return { ...v, galleryImages: newImages };
      }
      return v;
    }));

    // Update in database
    const variantKey = variant.filename.replace(/\.[^/.]+$/, '');
    const imageIds = newImages.map(img => img.id);
    await VariantImagesService.reorderVariantImages(variantKey, imageIds);

    setDraggedImageId(null);
    setDragOverVariantId(null);
  };

  // Toggle gallery expansion
  const toggleGalleryExpanded = (variantId: string) => {
    setVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return { ...v, galleryExpanded: !v.galleryExpanded };
      }
      return v;
    }));
  };

  // Filter variants
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === 'exists') matchesFilter = variant.exists;
    else if (filterType === 'missing') matchesFilter = !variant.exists;
    else if (filterType === 'gallery') matchesFilter = variant.galleryImages.length > 0;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Generating product variants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Product Image Galleries</h3>
          <p className="text-gray-600 text-sm">
            Upload multiple images per variant. Drag to reorder, star to set primary.
          </p>
        </div>
        <button
          onClick={generateVariants}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Grid className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Variants</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVariants}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">With Images</p>
                <p className="text-2xl font-bold text-green-600">{stats.existingImages}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-900">Missing</p>
                <p className="text-2xl font-bold text-orange-600">{stats.missingImages}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Images className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-900">With Gallery</p>
                <p className="text-2xl font-bold text-purple-600">
                  {variants.filter(v => v.galleryImages.length > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Variants</option>
            <option value="exists">With Images</option>
            <option value="missing">Missing Images</option>
            <option value="gallery">With Gallery</option>
          </select>
        </div>
      </div>

      {/* Variants List */}
      <div className="space-y-4">
        {filteredVariants.map((variant) => (
          <VariantGalleryCard
            key={variant.id}
            variant={variant}
            uploadStatus={uploadStatus[variant.id]}
            onGalleryUpload={(files) => handleGalleryUpload(variant.id, files)}
            onDeleteImage={(image) => handleDeleteGalleryImage(variant.id, image)}
            onSetPrimary={(image) => handleSetPrimary(variant.id, image)}
            onToggleExpanded={() => toggleGalleryExpanded(variant.id)}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e, variant.id)}
            onDrop={(e, index) => handleDrop(e, variant.id, index)}
            isDragOver={dragOverVariantId === variant.id}
          />
        ))}
      </div>
    </div>
  );
}

// Variant Gallery Card Component
function VariantGalleryCard({
  variant,
  uploadStatus,
  onGalleryUpload,
  onDeleteImage,
  onSetPrimary,
  onToggleExpanded,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver
}: {
  variant: VariantWithGallery;
  uploadStatus?: UploadStatus[string];
  onGalleryUpload: (files: FileList) => void;
  onDeleteImage: (image: VariantImage) => void;
  onSetPrimary: (image: VariantImage) => void;
  onToggleExpanded: () => void;
  onDragStart: (imageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragOver: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {variant.exists && variant.imageUrl ? (
              <img
                src={variant.imageUrl}
                alt={variant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div>
            <h4 className="font-medium text-gray-900">{variant.name}</h4>
            <p className="text-sm text-gray-500">{variant.filename}</p>
            <div className="flex items-center space-x-2 mt-1">
              {variant.exists ? (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  <Check className="w-3 h-3 mr-1" />
                  Main Image
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No Main Image
                </span>
              )}
              {variant.galleryImages.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  <Images className="w-3 h-3 mr-1" />
                  {variant.galleryImages.length} Gallery
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onGalleryUpload(e.target.files)}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={uploadStatus?.uploading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Add Gallery Images"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Expand/Collapse */}
          {variant.galleryExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadStatus?.uploading && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-gray-600">{uploadStatus.progress}%</span>
          </div>
          <div className="mt-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Gallery Grid (Expanded) */}
      {variant.galleryExpanded && (
        <div 
          className="p-4 border-t border-gray-100 bg-gray-50"
          onDragOver={onDragOver}
        >
          {variant.galleryImages.length === 0 ? (
            <div className="text-center py-8">
              <Images className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No gallery images yet</p>
              <p className="text-xs text-gray-400">Click + to add images</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {variant.galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => onDragStart(image.id)}
                  onDrop={(e) => onDrop(e, index)}
                  className="relative group aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 cursor-move"
                >
                  {/* Drag Handle */}
                  <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white p-1 rounded">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Primary Badge */}
                  {image.is_primary && (
                    <div className="absolute top-1 right-1 z-10">
                      <div className="bg-yellow-400 p-1 rounded">
                        <Star className="w-3 h-3 text-yellow-800" />
                      </div>
                    </div>
                  )}

                  {/* Order Badge */}
                  <div className="absolute bottom-1 left-1 z-10">
                    <span className="bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Image */}
                  <img
                    src={image.image_url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onSetPrimary(image)}
                      className={`p-1.5 rounded transition-colors ${
                        image.is_primary 
                          ? 'bg-yellow-400 text-yellow-800' 
                          : 'bg-white text-gray-700 hover:bg-yellow-100'
                      }`}
                      title={image.is_primary ? 'Primary Image' : 'Set as Primary'}
                    >
                      {image.is_primary ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => window.open(image.image_url, '_blank')}
                      className="p-1.5 bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors"
                      title="View Full Size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteImage(image)}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
