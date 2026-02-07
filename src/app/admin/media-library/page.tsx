// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Search,
  Filter,
  Image as ImageIcon,
  Tag,
  Link2,
  Unlink,
  Grid,
  List,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Edit2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { VariantImagesService, type SharedMedia } from '@/services/variantImagesService';
import { formatFileSize } from '@/lib/imageCompression';
import imageCompression from 'browser-image-compression';

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<SharedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMedia, setSelectedMedia] = useState<SharedMedia | null>(null);
  const [editingMedia, setEditingMedia] = useState<SharedMedia | null>(null);
  const [linkedVariants, setLinkedVariants] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media items
  const loadMediaItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await VariantImagesService.getSharedMedia(
        selectedTags.length > 0 ? selectedTags : undefined
      );
      setMediaItems(items);
      
      // Extract unique tags
      const tags = new Set<string>();
      items.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [selectedTags]);

  useEffect(() => {
    loadMediaItems();
  }, [loadMediaItems]);

  // Load linked variants when selecting a media item
  useEffect(() => {
    const loadLinkedVariants = async () => {
      if (selectedMedia) {
        const variants = await VariantImagesService.getVariantsForSharedMedia(selectedMedia.id);
        setLinkedVariants(variants);
      } else {
        setLinkedVariants([]);
      }
    };
    loadLinkedVariants();
  }, [selectedMedia]);

  const [uploadToAllProducts, setUploadToAllProducts] = useState(true);

  // Upload handler
  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Compress image
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.9,
        };

        const compressedBlob = await imageCompression(file, options);

        // Generate filename
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
        const filename = `shared_${timestamp}_${cleanName.replace(/\.[^/.]+$/, '')}.webp`;
        const uploadPath = `shared-media/${filename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('customization-item')
          .upload(uploadPath, compressedBlob, {
            contentType: 'image/webp',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('customization-item')
          .getPublicUrl(uploadPath);

        // Get image dimensions
        const img = new window.Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(compressedBlob);
        });

        // Add to database with "global" tag if checked
        const newMedia = await VariantImagesService.addSharedMedia(
          file.name.replace(/\.[^/.]+$/, ''), // Use original filename as name
          urlData.publicUrl,
          {
            fileSizeBytes: compressedBlob.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            tags: uploadToAllProducts ? ['global'] : []
          }
        );

        if (newMedia) {
          setMediaItems(prev => [newMedia, ...prev]);
        }

        URL.revokeObjectURL(img.src);
      } catch (err: any) {
        console.error('Error uploading file:', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    setSuccess(`Uploaded ${files.length} image(s) successfully`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Delete handler
  const handleDelete = async (media: SharedMedia) => {
    if (!confirm(`Delete "${media.name}"? This cannot be undone.`)) return;

    try {
      // Extract file path from URL
      const urlParts = media.image_url.split('/storage/v1/object/public/customization-item/');
      if (urlParts.length === 2) {
        await supabase.storage
          .from('customization-item')
          .remove([urlParts[1].split('?')[0]]);
      }

      await VariantImagesService.deleteSharedMedia(media.id);
      setMediaItems(prev => prev.filter(m => m.id !== media.id));
      
      if (selectedMedia?.id === media.id) {
        setSelectedMedia(null);
      }

      setSuccess('Image deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // Update media handler
  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    try {
      await VariantImagesService.updateSharedMedia(editingMedia.id, {
        name: editingMedia.name,
        description: editingMedia.description,
        tags: editingMedia.tags
      });

      setMediaItems(prev => prev.map(m => 
        m.id === editingMedia.id ? editingMedia : m
      ));
      
      if (selectedMedia?.id === editingMedia.id) {
        setSelectedMedia(editingMedia);
      }

      setEditingMedia(null);
      setSuccess('Updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh tags
      loadMediaItems();
    } catch (err: any) {
      setError(`Failed to update: ${err.message}`);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      handleUpload(files);
    }
  };

  // Filter media items
  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">
            Upload and manage shared images that can be linked to multiple product variants.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div 
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          
          {uploading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-gray-600 mb-2">
                {dragActive ? 'Drop images here' : 'Drag and drop images, or'}
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Select Files
              </Button>
              
              {/* Upload Options */}
              <label className="flex items-center justify-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadToAllProducts}
                  onChange={(e) => setUploadToAllProducts(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  Show on ALL products (as last image)
                </span>
              </label>
              
              <p className="text-xs text-gray-500 mt-2">
                Supports JPEG, PNG, WebP. Auto-compressed to WebP.
              </p>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
            
            {allTags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 5).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{filteredMedia.length} items</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedTags.length > 0 
                ? 'Try adjusting your search or filters'
                : 'Upload your first image to get started'
              }
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map(media => (
              <MediaCard
                key={media.id}
                media={media}
                isSelected={selectedMedia?.id === media.id}
                onClick={() => setSelectedMedia(media)}
                onDelete={() => handleDelete(media)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map(media => (
              <MediaListItem
                key={media.id}
                media={media}
                isSelected={selectedMedia?.id === media.id}
                onClick={() => setSelectedMedia(media)}
                onDelete={() => handleDelete(media)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Sidebar */}
      {selectedMedia && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Details</h3>
            <button onClick={() => setSelectedMedia(null)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Preview */}
          <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4 border">
            <img
              src={selectedMedia.image_url}
              alt={selectedMedia.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Editable Fields */}
          {editingMedia ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingMedia.name}
                  onChange={(e) => setEditingMedia({ ...editingMedia, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingMedia.description || ''}
                  onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingMedia.tags?.join(', ') || ''}
                  onChange={(e) => setEditingMedia({ 
                    ...editingMedia, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="bracelet, gold, emerald"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateMedia} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button onClick={() => setEditingMedia(null)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Name</span>
                  <p className="text-sm font-medium text-gray-900">{selectedMedia.name}</p>
                </div>
                {selectedMedia.description && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Description</span>
                    <p className="text-sm text-gray-700">{selectedMedia.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500 uppercase">Size</span>
                  <p className="text-sm text-gray-700">
                    {selectedMedia.width}×{selectedMedia.height} px
                    {selectedMedia.file_size_bytes && ` • ${formatFileSize(selectedMedia.file_size_bytes)}`}
                  </p>
                </div>
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMedia.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => setEditingMedia(selectedMedia)} 
                variant="outline" 
                size="sm"
                className="w-full mb-4"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit Details
              </Button>
            </>
          )}

          {/* Linked Variants */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase">Linked Variants</span>
              <span className="text-xs text-gray-500">{linkedVariants.length}</span>
            </div>
            {linkedVariants.length > 0 ? (
              <div className="space-y-1">
                {linkedVariants.map(variant => (
                  <div key={variant} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <span className="truncate">{variant}</span>
                    <button
                      onClick={async () => {
                        await VariantImagesService.unlinkSharedMediaFromVariant(variant, selectedMedia.id);
                        setLinkedVariants(prev => prev.filter(v => v !== variant));
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                Not linked to any variants
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(selectedMedia.image_url, '_blank')}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Full Size
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(selectedMedia)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Media Card Component
function MediaCard({ 
  media, 
  isSelected, 
  onClick, 
  onDelete 
}: { 
  media: SharedMedia; 
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
      }`}
    >
      <img
        src={media.image_url}
        alt={media.name}
        className="w-full h-full object-cover"
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-white text-xs truncate">{media.name}</p>
      </div>

      {/* Tags indicator */}
      {media.tags && media.tags.length > 0 && (
        <div className="absolute top-2 right-2">
          <Tag className="w-4 h-4 text-white drop-shadow" />
        </div>
      )}
    </div>
  );
}

// Media List Item Component
function MediaListItem({ 
  media, 
  isSelected, 
  onClick, 
  onDelete 
}: { 
  media: SharedMedia; 
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
        <img
          src={media.image_url}
          alt={media.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 ml-4 min-w-0">
        <p className="font-medium text-gray-900 truncate">{media.name}</p>
        <p className="text-sm text-gray-500">
          {media.width}×{media.height}
          {media.file_size_bytes && ` • ${formatFileSize(media.file_size_bytes)}`}
        </p>
        {media.tags && media.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {media.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{media.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 text-gray-400 hover:text-red-500"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
