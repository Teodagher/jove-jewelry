'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  reorderTemplates,
  saveTemplates,
} from '@/lib/jove-lab-storage';
import type { JoveLabTemplate } from '@/types/jove-lab';
import { supabase } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<JoveLabTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<JoveLabTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hero_image_url: '',
    gallery_images: [] as string[],
    is_active: true,
  });

  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const data = getTemplates().sort((a, b) => a.display_order - b.display_order);
    setTemplates(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hero_image_url: '',
      gallery_images: [],
      is_active: true,
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    const template = createTemplate({
      name: formData.name,
      description: formData.description,
      hero_image_url: formData.hero_image_url || null,
      gallery_images: formData.gallery_images,
      is_active: formData.is_active,
    });

    setTemplates(prev => [...prev, template]);
    setShowCreateModal(false);
    resetForm();
    setSaving(false);
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;

    setSaving(true);
    const updated = updateTemplate(editingTemplate.id, {
      name: formData.name,
      description: formData.description,
      hero_image_url: formData.hero_image_url || null,
      gallery_images: formData.gallery_images,
      is_active: formData.is_active,
    });

    if (updated) {
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    }

    setEditingTemplate(null);
    resetForm();
    setSaving(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    
    deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleActive = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    const updated = updateTemplate(id, { is_active: !template.is_active });
    if (updated) {
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const openEditModal = (template: JoveLabTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      hero_image_url: template.hero_image_url || '',
      gallery_images: template.gallery_images || [],
      is_active: template.is_active,
    });
    setEditingTemplate(template);
  };

  // Image upload handler
  const handleImageUpload = async (file: File, type: 'hero' | 'gallery') => {
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        fileType: 'image/webp' as const,
        initialQuality: 0.9,
      };

      const compressedBlob = await imageCompression(file, options);
      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const filename = `jovelab_${type}_${timestamp}_${cleanName.replace(/\.[^/.]+$/, '')}.webp`;
      const uploadPath = `jove-lab/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('customization-item')
        .upload(uploadPath, compressedBlob, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('customization-item')
        .getPublicUrl(uploadPath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      return null;
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await handleImageUpload(file, 'hero');
    if (url) {
      setFormData(prev => ({ ...prev, hero_image_url: url }));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      const url = await handleImageUpload(file, 'gallery');
      if (url) {
        setFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, url],
        }));
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newTemplates = [...templates];
    const draggedIndex = newTemplates.findIndex(t => t.id === draggedId);
    const targetIndex = newTemplates.findIndex(t => t.id === targetId);

    const [dragged] = newTemplates.splice(draggedIndex, 1);
    newTemplates.splice(targetIndex, 0, dragged);

    // Update display orders
    const reordered = newTemplates.map((t, i) => ({ ...t, display_order: i }));
    setTemplates(reordered);
    saveTemplates(reordered);
    setDraggedId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/jove-lab"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-wide">
              Templates / Architectures
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage design templates that customers can choose from
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4">Create your first design template to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div
                key={template.id}
                draggable
                onDragStart={(e) => handleDragStart(e, template.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, template.id)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === template.id ? 'opacity-50' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                {/* Hero Image Thumbnail */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {template.hero_image_url ? (
                    <img
                      src={template.hero_image_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {template.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {template.gallery_images.length} gallery images
                    </span>
                  </div>
                </div>

                {/* Status */}
                <button
                  onClick={() => handleToggleActive(template.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    template.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {template.is_active ? (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Hidden
                    </span>
                  )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Solitaire"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Describe this design architecture..."
                />
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image
                </label>
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroUpload}
                  className="hidden"
                />
                {formData.hero_image_url ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.hero_image_url}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, hero_image_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => heroInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload hero image</span>
                  </button>
                )}
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Images
                </label>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-4 gap-3">
                  {formData.gallery_images.map((url, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
