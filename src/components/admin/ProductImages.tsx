// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast-provider';
import { variantGenerator, type ProductVariant, type VariantGenerationResult } from '@/services/variantGenerator';
import { compressToTargetSize, formatFileSize } from '@/lib/imageCompression';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  ZoomIn
} from 'lucide-react';

interface ProductImagesProps {
  productId: string;
  productType: string;
  productSlug?: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

interface UploadStatus {
  [variantId: string]: {
    uploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
  };
}

export default function ProductImages({ productId, productType, productSlug, refreshTrigger }: ProductImagesProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VariantGenerationResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'exists' | 'missing'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { addToast } = useToast();

  useEffect(() => {
    generateVariants();
  }, [productId, productType, refreshTrigger]);

  const generateVariants = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting variant generation for product:', productId, 'type:', productType, 'refresh trigger:', refreshTrigger);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Variant generation timed out after 30 seconds')), 30000)
      );

      const variantPromise = variantGenerator.generateVariantsForProduct(productId, productType);
      
      const result = await Promise.race([variantPromise, timeoutPromise]) as any;
      
      console.log('✅ Variant generation completed:', result);
      setVariants(result.variants);
      setStats(result);
      
      addToast({
        type: 'success',
        title: 'Variants Generated',
        message: `Found ${result.totalVariants} possible variants (${result.existingImages} with images)`
      });
    } catch (error: any) {
      console.error('❌ Error generating variants:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate product variants'
      });
      
      // Set empty state instead of staying in loading
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
  };

  const handleFileSelect = async (variantId: string, file: File) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    // Update upload status
    setUploadStatus(prev => ({
      ...prev,
      [variantId]: {
        uploading: true,
        progress: 0,
        error: null,
        success: false
      }
    }));

    try {
      // Update progress
      setUploadStatus(prev => ({
        ...prev,
        [variantId]: { ...prev[variantId], progress: 25 }
      }));

      // Compress image to target size (~100KB)
      const compressedBlob = await compressToTargetSize(file, 100, {
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp'
      });

      setUploadStatus(prev => ({
        ...prev,
        [variantId]: { ...prev[variantId], progress: 50 }
      }));

      // Upload to Supabase Storage
      const uploadPath = variantGenerator.generateUploadPath(productType, variant.filename);
      
      const { data, error } = await supabase.storage
        .from('customization-item')
        .upload(uploadPath, compressedBlob, {
          contentType: 'image/webp',
          upsert: true // Overwrite if exists
        });

      setUploadStatus(prev => ({
        ...prev,
        [variantId]: { ...prev[variantId], progress: 90 }
      }));

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('customization-item')
        .getPublicUrl(uploadPath);

      // Update variant state
      setVariants(prev => prev.map(v => 
        v.id === variantId 
          ? { ...v, imageUrl: urlData.publicUrl, exists: true }
          : v
      ));

      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          existingImages: prev.existingImages + (variant.exists ? 0 : 1),
          missingImages: prev.missingImages - (variant.exists ? 0 : 1)
        } : null);
      }

      setUploadStatus(prev => ({
        ...prev,
        [variantId]: {
          uploading: false,
          progress: 100,
          error: null,
          success: true
        }
      }));

      const sizeKB = (compressedBlob.size / 1024).toFixed(1);
      addToast({
        type: 'success',
        title: 'Image Uploaded',
        message: `${variant.name} (${sizeKB} KB) uploaded successfully`
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadStatus(prev => ({
        ...prev,
        [variantId]: {
          uploading: false,
          progress: 0,
          error: error.message || 'Upload failed',
          success: false
        }
      }));

      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: `Failed to upload ${variant.name}: ${error.message}`
      });
    }
  };

  const handleFileInputChange = (variantId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(variantId, file);
    }
  };

  const handleDrop = (variantId: string, event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(variantId, file);
    }
  };

  const handleDeleteImage = async (variant: ProductVariant) => {
    if (!variant.exists || !variant.imageUrl) return;

    try {
      const uploadPath = variantGenerator.generateUploadPath(productType, variant.filename);
      
      const { error } = await supabase.storage
        .from('customization-item')
        .remove([uploadPath]);

      if (error) {
        throw error;
      }

      // Update variant state
      setVariants(prev => prev.map(v => 
        v.id === variant.id 
          ? { ...v, imageUrl: null, exists: false }
          : v
      ));

      // Update stats
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          existingImages: prev.existingImages - 1,
          missingImages: prev.missingImages + 1
        } : null);
      }

      addToast({
        type: 'success',
        title: 'Image Deleted',
        message: `${variant.name} image has been removed`
      });

    } catch (error: any) {
      console.error('Error deleting image:', error);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete ${variant.name}: ${error.message}`
      });
    }
  };

  // Filter variants based on search and filter type
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'exists' && variant.exists) ||
                         (filterType === 'missing' && !variant.exists);
    
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
          <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
          <p className="text-gray-600 text-sm">
            Upload images for each product variant. Images will be automatically compressed to WebP format (~100KB).
          </p>
        </div>
        <button
          onClick={generateVariants}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Variants
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
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
                <p className="text-sm font-medium text-orange-900">Missing Images</p>
                <p className="text-2xl font-bold text-orange-600">{stats.missingImages}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'exists' | 'missing')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Variants</option>
            <option value="exists">With Images</option>
            <option value="missing">Missing Images</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Variants Grid/List */}
      {filteredVariants.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No variants found</h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'This product has no customization options configured'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredVariants.map((variant) => (
            <VariantImageCard
              key={variant.id}
              variant={variant}
              uploadStatus={uploadStatus[variant.id]}
              onFileSelect={(file) => handleFileSelect(variant.id, file)}
              onDelete={() => handleDeleteImage(variant)}
              onView={() => setSelectedVariant(variant)}
              viewMode={viewMode}
              fileInputRef={(ref) => fileInputRefs.current[variant.id] = ref}
              onFileInputChange={(e) => handleFileInputChange(variant.id, e)}
              onDrop={(e) => handleDrop(variant.id, e)}
            />
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedVariant && (
        <ImagePreviewModal 
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
}

// Variant Image Card Component
function VariantImageCard({
  variant,
  uploadStatus,
  onFileSelect,
  onDelete,
  onView,
  viewMode,
  fileInputRef,
  onFileInputChange,
  onDrop
}: {
  variant: ProductVariant;
  uploadStatus?: UploadStatus[string];
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  onView: () => void;
  viewMode: 'grid' | 'list';
  fileInputRef: (ref: HTMLInputElement | null) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {/* Image Preview */}
          <div className="flex-shrink-0">
            {variant.exists && variant.imageUrl ? (
              <div className="relative group">
                <img
                  src={variant.imageUrl}
                  alt={variant.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <button
                  onClick={onView}
                  className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                >
                  <ZoomIn className="w-6 h-6 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Variant Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{variant.name}</h4>
            <p className="text-sm text-gray-500 truncate">{variant.filename}</p>
          </div>

          {/* Status */}
          <div className="flex-shrink-0">
            {variant.exists ? (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                <Check className="w-3 h-3 mr-1" />
                Uploaded
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                <AlertCircle className="w-3 h-3 mr-1" />
                Missing
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef(null)?.click()}
              disabled={uploadStatus?.uploading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Upload Image"
            >
              <Upload className="w-4 h-4" />
            </button>
            {variant.exists && (
              <>
                <button
                  onClick={onView}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="View Image"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadStatus?.uploading && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-600">{uploadStatus.progress}%</span>
            </div>
            <div className="mt-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadStatus?.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {uploadStatus.error}
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Image Area */}
      <div
        className={`relative aspect-square bg-gray-50 border-2 border-dashed transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : variant.exists 
              ? 'border-green-300' 
              : 'border-gray-300'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false);
          onDrop(e);
        }}
      >
        {variant.exists && variant.imageUrl ? (
          <div className="relative w-full h-full group">
            <img
              src={variant.imageUrl}
              alt={variant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                onClick={onView}
                className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                title="View Full Size"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Delete Image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Upload className="w-12 h-12 mb-2" />
            <p className="text-sm text-center px-4">
              {uploadStatus?.uploading ? 'Uploading...' : 'Drop image or click to upload'}
            </p>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploadStatus?.uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <div className="bg-white rounded-lg p-4 w-3/4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Uploading...</span>
                <span>{uploadStatus.progress}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus?.uploading}
        />
      </div>

      {/* Variant Info */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-1 truncate">{variant.name}</h4>
        <p className="text-sm text-gray-500 mb-2 truncate">{variant.filename}</p>
        
        {/* Status Badge */}
        {variant.exists ? (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <Check className="w-3 h-3 mr-1" />
            Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
            <AlertCircle className="w-3 h-3 mr-1" />
            Missing
          </span>
        )}

        {/* Upload Error */}
        {uploadStatus?.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {uploadStatus.error}
          </div>
        )}
      </div>
    </div>
  );
}

// Image Preview Modal
function ImagePreviewModal({ variant, onClose }: { variant: ProductVariant; onClose: () => void }) {
  if (!variant.imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-75" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{variant.name}</h3>
            <p className="text-sm text-gray-500">{variant.filename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Image */}
        <div className="p-4">
          <img
            src={variant.imageUrl}
            alt={variant.name}
            className="max-w-full max-h-[70vh] mx-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
