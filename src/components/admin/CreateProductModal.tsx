'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Package, Upload, AlertCircle } from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
}

interface ProductFormData {
  name: string;
  product_type: 'simple' | 'customizable';
  base_price: number;
  base_price_lab_grown: number | null;
  black_onyx_base_price: number | null;
  black_onyx_base_price_lab_grown: number | null;
  slug: string;
  description: string;
  display_order: number;
  base_image_url: string | null;
}

export default function CreateProductModal({ isOpen, onClose, onProductCreated }: CreateProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    product_type: 'customizable',
    base_price: 0,
    base_price_lab_grown: null,
    black_onyx_base_price: null,
    black_onyx_base_price_lab_grown: null,
    slug: '',
    description: '',
    display_order: 1,
    base_image_url: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  // Auto-generate slug and type from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateType = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }


    if (formData.base_price < 0) {
      newErrors.base_price = 'Base price must be 0 or greater';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.display_order < 1) {
      newErrors.display_order = 'Display order must be 1 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Check if slug already exists
      const { data: existingProduct } = await supabase
        .from('jewelry_items')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingProduct) {
        setErrors({ slug: 'This slug is already taken' });
        setLoading(false);
        return;
      }

      // Create the product
      const productData = {
        name: formData.name.trim(),
        type: generateType(formData.name.trim()),
        product_type: formData.product_type,
        base_price: formData.base_price,
        base_price_lab_grown: formData.base_price_lab_grown,
        black_onyx_base_price: formData.black_onyx_base_price,
        black_onyx_base_price_lab_grown: formData.black_onyx_base_price_lab_grown,
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        display_order: formData.display_order,
        base_image_url: formData.base_image_url,
        is_active: true
      };

      const { data: newProduct, error } = await supabase
        .from('jewelry_items')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        if (error.code === '23505') {
          setErrors({ slug: 'This slug is already taken' });
        } else {
          setErrors({ general: 'Failed to create product. Please try again.' });
        }
        return;
      }

      // Success!
      onProductCreated(newProduct);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        product_type: 'customizable',
        base_price: 0,
        base_price_lab_grown: null,
        black_onyx_base_price: null,
        black_onyx_base_price_lab_grown: null,
        slug: '',
        description: '',
        display_order: 1,
        base_image_url: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-zinc-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{errors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Elegant Rose Gold Bracelet, Diamond Engagement Ring"
                  disabled={loading}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>


              {/* Product Type (Simple/Customizable) */}
              <div>
                <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <select
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value as 'simple' | 'customizable' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                  disabled={loading}
                >
                  <option value="customizable">Customizable</option>
                  <option value="simple">Simple</option>
                </select>
              </div>

              {/* Base Price */}
              <div>
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  id="base_price"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 ${
                    errors.base_price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.base_price && <p className="mt-1 text-sm text-red-600">{errors.base_price}</p>}
              </div>

              {/* Lab Grown Base Price */}
              <div>
                <label htmlFor="base_price_lab_grown" className="block text-sm font-medium text-gray-700 mb-2">
                  Lab Grown Base Price ($)
                </label>
                <input
                  type="number"
                  id="base_price_lab_grown"
                  step="0.01"
                  min="0"
                  value={formData.base_price_lab_grown || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    base_price_lab_grown: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                  placeholder="Optional"
                  disabled={loading}
                />
              </div>

              {/* Display Order */}
              <div>
                <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order *
                </label>
                <input
                  type="number"
                  id="display_order"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 ${
                    errors.display_order ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.display_order && <p className="mt-1 text-sm text-red-600">{errors.display_order}</p>}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 font-mono text-sm ${
                    errors.slug ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="elegant-gold-bracelet"
                  disabled={loading}
                />
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Will be available at: /customize/{formData.slug || 'product-slug'}
                </p>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                  placeholder="Optional product description..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Advanced Pricing (Collapsible) */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                Advanced Pricing (Black Onyx Options)
              </summary>
              <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="black_onyx_base_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Black Onyx Base Price ($)
                  </label>
                  <input
                    type="number"
                    id="black_onyx_base_price"
                    step="0.01"
                    min="0"
                    value={formData.black_onyx_base_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      black_onyx_base_price: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                    placeholder="Optional"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="black_onyx_base_price_lab_grown" className="block text-sm font-medium text-gray-700 mb-2">
                    Black Onyx Lab Grown Price ($)
                  </label>
                  <input
                    type="number"
                    id="black_onyx_base_price_lab_grown"
                    step="0.01"
                    min="0"
                    value={formData.black_onyx_base_price_lab_grown || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      black_onyx_base_price_lab_grown: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500"
                    placeholder="Optional"
                    disabled={loading}
                  />
                </div>
              </div>
            </details>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 inline-flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
