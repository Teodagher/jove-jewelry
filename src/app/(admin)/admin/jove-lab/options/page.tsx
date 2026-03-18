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
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import {
  getOptionCategories,
  getOptions,
  createOptionCategory,
  updateOptionCategory,
  deleteOptionCategory,
  createOption,
  updateOption,
  deleteOption,
  saveOptions,
  saveOptionCategories,
} from '@/lib/jove-lab-storage';
import type { JoveLabOptionCategory, JoveLabOption } from '@/types/jove-lab';
import { supabase } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';

export default function OptionsPage() {
  const [categories, setCategories] = useState<JoveLabOptionCategory[]>([]);
  const [options, setOptions] = useState<JoveLabOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [editingCategory, setEditingCategory] = useState<JoveLabOptionCategory | null>(null);
  const [editingOption, setEditingOption] = useState<JoveLabOption | null>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    is_active: true,
  });

  const [optionFormData, setOptionFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    image_url: '',
    is_active: true,
  });

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const cats = getOptionCategories().sort((a, b) => a.display_order - b.display_order);
    setCategories(cats);
    setOptions(getOptions());
    // Expand all categories by default
    setExpandedCategories(new Set(cats.map(c => c.id)));
    setLoading(false);
  };

  const getOptionsForCategory = (categoryId: string) => {
    return options
      .filter(o => o.category_id === categoryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Category handlers
  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', is_active: true });
  };

  const handleCreateCategory = () => {
    if (!categoryFormData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    setSaving(true);
    const category = createOptionCategory({
      name: categoryFormData.name,
      is_active: categoryFormData.is_active,
    });

    setCategories(prev => [...prev, category]);
    setExpandedCategories(prev => new Set([...prev, category.id]));
    setShowCreateCategoryModal(false);
    resetCategoryForm();
    setSaving(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    setSaving(true);
    const updated = updateOptionCategory(editingCategory.id, {
      name: categoryFormData.name,
      is_active: categoryFormData.is_active,
    });

    if (updated) {
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    }

    setEditingCategory(null);
    resetCategoryForm();
    setSaving(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    const optionCount = getOptionsForCategory(id).length;
    const message = optionCount > 0
      ? `Delete "${name}" and its ${optionCount} option(s)? This cannot be undone.`
      : `Delete "${name}"? This cannot be undone.`;
    
    if (!confirm(message)) return;

    deleteOptionCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setOptions(prev => prev.filter(o => o.category_id !== id));
  };

  const openEditCategoryModal = (category: JoveLabOptionCategory) => {
    setCategoryFormData({
      name: category.name,
      is_active: category.is_active,
    });
    setEditingCategory(category);
  };

  // Option handlers
  const resetOptionForm = () => {
    setOptionFormData({
      category_id: '',
      name: '',
      description: '',
      image_url: '',
      is_active: true,
    });
  };

  const handleCreateOption = () => {
    if (!optionFormData.name.trim()) {
      alert('Please enter an option name');
      return;
    }

    setSaving(true);
    const option = createOption({
      category_id: optionFormData.category_id,
      name: optionFormData.name,
      description: optionFormData.description || null,
      image_url: optionFormData.image_url || null,
      is_active: optionFormData.is_active,
    });

    setOptions(prev => [...prev, option]);
    setShowCreateOptionModal(false);
    resetOptionForm();
    setSaving(false);
  };

  const handleUpdateOption = () => {
    if (!editingOption) return;

    setSaving(true);
    const updated = updateOption(editingOption.id, {
      name: optionFormData.name,
      description: optionFormData.description || null,
      image_url: optionFormData.image_url || null,
      is_active: optionFormData.is_active,
    });

    if (updated) {
      setOptions(prev => prev.map(o => o.id === updated.id ? updated : o));
    }

    setEditingOption(null);
    resetOptionForm();
    setSaving(false);
  };

  const handleDeleteOption = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    deleteOption(id);
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const handleToggleOptionActive = (id: string) => {
    const option = options.find(o => o.id === id);
    if (!option) return;

    const updated = updateOption(id, { is_active: !option.is_active });
    if (updated) {
      setOptions(prev => prev.map(o => o.id === updated.id ? updated : o));
    }
  };

  const openEditOptionModal = (option: JoveLabOption) => {
    setOptionFormData({
      category_id: option.category_id,
      name: option.name,
      description: option.description || '',
      image_url: option.image_url || '',
      is_active: option.is_active,
    });
    setEditingOption(option);
  };

  const openCreateOptionModal = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setOptionFormData(prev => ({ ...prev, category_id: categoryId }));
    setShowCreateOptionModal(true);
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp' as const,
        initialQuality: 0.9,
      };

      const compressedBlob = await imageCompression(file, options);
      const timestamp = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const filename = `jovelab_option_${timestamp}_${cleanName.replace(/\.[^/.]+$/, '')}.webp`;
      const uploadPath = `jove-lab/options/${filename}`;

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

      setOptionFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    }
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
              Option Library
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage shapes, sizes, metals, and other design options
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetCategoryForm();
            setShowCreateCategoryModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories & Options */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-4">Create categories to organize your design options</p>
            <button
              onClick={() => {
                resetCategoryForm();
                setShowCreateCategoryModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </button>
          </div>
        ) : (
          categories.map((category) => {
            const categoryOptions = getOptionsForCategory(category.id);
            const isExpanded = expandedCategories.has(category.id);

            return (
              <div
                key={category.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {categoryOptions.length} option{categoryOptions.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      category.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.is_active ? 'Active' : 'Hidden'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCreateOptionModal(category.id)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                      title="Add option"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditCategoryModal(category)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Options List */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {categoryOptions.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p className="mb-3">No options in this category</p>
                        <button
                          onClick={() => openCreateOptionModal(category.id)}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          + Add first option
                        </button>
                      </div>
                    ) : (
                      categoryOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50"
                        >
                          <div className="cursor-grab">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>

                          {/* Thumbnail */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {option.image_url ? (
                              <img
                                src={option.image_url}
                                alt={option.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{option.name}</h4>
                            <p className="text-sm text-gray-500 truncate">
                              {option.description || 'No description'}
                            </p>
                          </div>

                          {/* Status */}
                          <button
                            onClick={() => handleToggleOptionActive(option.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                              option.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {option.is_active ? (
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditOptionModal(option)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOption(option.id, option.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Category Modal */}
      {(showCreateCategoryModal || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Shape, Size, Metal"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="category_is_active"
                  checked={categoryFormData.is_active}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="category_is_active" className="text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateCategoryModal(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Option Modal */}
      {(showCreateOptionModal || editingOption) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">
                {editingOption ? 'Edit Option' : 'Create Option'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Category selector (only for create) */}
              {!editingOption && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={optionFormData.category_id}
                    onChange={(e) => setOptionFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option Name *
                </label>
                <input
                  type="text"
                  value={optionFormData.name}
                  onChange={(e) => setOptionFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g., Round Brilliant, Platinum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={optionFormData.description}
                  onChange={(e) => setOptionFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Brief description of this option..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {optionFormData.image_url ? (
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={optionFormData.image_url}
                      alt="Option"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setOptionFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="option_is_active"
                  checked={optionFormData.is_active}
                  onChange={(e) => setOptionFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="option_is_active" className="text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateOptionModal(false);
                  setEditingOption(null);
                  resetOptionForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingOption ? handleUpdateOption : handleCreateOption}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingOption ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
