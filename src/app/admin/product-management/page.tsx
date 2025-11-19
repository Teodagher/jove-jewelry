'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit, Eye, Settings, Package, ExternalLink, Trash2, Upload, ImageIcon, Save, X, Layers } from 'lucide-react';
import Link from 'next/link';
import CreateProductModal from '@/components/admin/CreateProductModal';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
  product_type: 'simple' | 'customizable';
  base_price: number;
  base_price_lab_grown?: number | null;
  black_onyx_base_price?: number | null;
  black_onyx_base_price_lab_grown?: number | null;
  base_image_url: string | null;
  is_active: boolean;
  published?: boolean;
  slug: string | null;
  display_order: number;
  description: string | null;
  category_id: string | null;
  created_at: string;
  updated_at?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductManagementPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<JewelryItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'simple' | 'customizable'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    display_order: 0
  });


  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (productId: string, field: 'is_active' | 'published', currentValue: boolean) => {
    try {
      const updateData: Record<string, boolean> = {};
      updateData[field] = !currentValue;
      
      const { error } = await (supabase as any)
        .from('jewelry_items')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error('Error updating product status:', error);
        return;
      }

      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, [field]: !currentValue }
            : product
        )
      );
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleProductCreated = (newProduct: JewelryItem) => {
    setProducts(prev => [newProduct, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteProduct = async (product: JewelryItem) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete product image from storage if it exists
      if (product.base_image_url) {
        try {
          const imagePath = product.base_image_url.split('/item-pictures/')[1];
          if (imagePath) {
            await supabase.storage
              .from('item-pictures')
              .remove([imagePath]);
          }
        } catch (err) {
          console.warn('Failed to delete product image:', err);
          // Continue with product deletion even if image deletion fails
        }
      }

      // Delete the product from database
      const { error } = await supabase
        .from('jewelry_items')
        .delete()
        .eq('id', product.id);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
        return;
      }

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== product.id));

    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Category management functions
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const slug = newCategory.name.toLowerCase().replace(/\s+/g, '-');

      const { error } = await (supabase as any)
        .from('product_categories')
        .insert({
          name: newCategory.name,
          slug: slug,
          description: newCategory.description || null,
          display_order: newCategory.display_order
        });

      if (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category. The name might already exist.');
        return;
      }

      await fetchCategories();
      setShowCreateCategoryModal(false);
      setNewCategory({ name: '', description: '', display_order: 0 });
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
    }
  };

  const handleUpdateCategory = async (category: ProductCategory) => {
    try {
      const { error } = await (supabase as any)
        .from('product_categories')
        .update({
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active
        })
        .eq('id', category.id);

      if (error) {
        console.error('Error updating category:', error);
        alert('Failed to update category.');
        return;
      }

      await fetchCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will not be deleted, but they will lose their category assignment.')) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category.');
        return;
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category.');
    }
  };

  const handleCategoryImageUpload = async (categoryId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const category = categories.find(c => c.id === categoryId);

      // Delete old image if it exists
      if (category?.image_url) {
        try {
          const oldImagePath = category.image_url.split('/categories-pictures/')[1];
          if (oldImagePath) {
            const { error: deleteError } = await supabase.storage
              .from('categories-pictures')
              .remove([oldImagePath]);

            if (deleteError) {
              console.warn('Failed to delete old image:', deleteError);
              // Continue anyway - don't block the new upload
            }
          }
        } catch (err) {
          console.warn('Error parsing old image path:', err);
        }
      }

      setUploadProgress(25);

      // Import the compression utilities
      const { compressToTargetSize, generateOptimizedFileName } = await import('@/lib/imageCompression');

      // Compress the image
      const compressedBlob = await compressToTargetSize(file, 100, {
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp'
      });

      setUploadProgress(50);

      // Generate optimized filename
      const fileName = generateOptimizedFileName(file.name);
      const filePath = `categories/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('categories-pictures')
        .upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        return;
      }

      setUploadProgress(75);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('categories-pictures')
        .getPublicUrl(filePath);

      setUploadProgress(90);

      // Update database with new image URL
      const { error: updateError } = await (supabase as any)
        .from('product_categories')
        .update({ image_url: publicUrl })
        .eq('id', categoryId);

      if (updateError) {
        console.error('Error saving image:', updateError);
        alert('Image uploaded but failed to save. Please try again.');
        return;
      }

      setUploadProgress(100);
      await fetchCategories();
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCategoryImageDelete = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category?.image_url || !confirm('Are you sure you want to delete this image?')) return;

    try {
      setUploading(true);
      const imagePath = category.image_url.split('/categories-pictures/')[1];
      if (imagePath) {
        await supabase.storage
          .from('categories-pictures')
          .remove([imagePath]);
      }

      await (supabase as any)
        .from('product_categories')
        .update({ image_url: null })
        .eq('id', categoryId);

      await fetchCategories();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image.');
    } finally {
      setUploading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.product_type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 tracking-wide">Product Management</h1>
          <p className="text-zinc-600 mt-1">Manage your jewelry products, categories, and customization options</p>
        </div>
        <button
          onClick={() => activeTab === 'products' ? setShowCreateModal(true) : setShowCreateCategoryModal(true)}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'products' ? 'Create Product' : 'Create Category'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            Categories ({categories.length})
          </button>
        </nav>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => setFilter('customizable')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'customizable'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Customizable ({products.filter(p => p.product_type === 'customizable').length})
            </button>
            <button
              onClick={() => setFilter('simple')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'simple'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              Simple Products ({products.filter(p => p.product_type === 'simple').length})
            </button>
          </div>

          {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-zinc-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 mb-2">No products found</h3>
          <p className="text-zinc-600 mb-6">
            {filter === 'all' ? 'Create your first product to get started' : `No ${filter} products available`}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.base_image_url ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.base_image_url}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                              {product.slug ? `/customize/${product.slug}` : 'No URL'}
                            </div>
                            {product.slug && (
                              <Link
                                href={`/customize/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  product.published 
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' 
                                    : 'text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700'
                                }`}
                                title={product.published ? "View live customization page" : "Preview customization page (not public)"}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {product.published ? 'View' : 'Preview'}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.product_type === 'customizable'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.category_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                          {categories.find(c => c.id === product.category_id)?.name || 'Unknown'}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No category</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {product.base_price && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs">
                            🇱🇧🌍 ${product.base_price}
                          </span>
                        )}
                        {(product as any).base_price_au && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
                            🇦🇺 A${(product as any).base_price_au}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleProductStatus(product.id, 'is_active', product.is_active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            product.is_active 
                              ? 'bg-green-500 focus:ring-green-500' 
                              : 'bg-gray-200 focus:ring-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              product.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${
                          product.is_active ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {product.is_active && product.slug && (
                        <Link
                          href={`/customize/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-zinc-900 inline-flex items-center"
                          title="View customization page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/product-management/edit/${product.id}`}
                        className="text-zinc-600 hover:text-zinc-900 inline-flex items-center"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {product.product_type === 'customizable' && (
                        <Link
                          href={`/admin/product-management/customize/${product.id}`}
                          className="text-zinc-600 hover:text-zinc-900 inline-flex items-center"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="text-white text-xs">{uploadProgress}%</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label
                            htmlFor={`image-upload-${category.id}`}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors cursor-pointer ${
                              uploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            {category.image_url ? 'Change' : 'Upload'}
                          </label>
                          <input
                            id={`image-upload-${category.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCategoryImageUpload(category.id, e)}
                            disabled={uploading}
                            className="hidden"
                          />
                          {category.image_url && (
                            <button
                              type="button"
                              onClick={() => handleCategoryImageDelete(category.id)}
                              disabled={uploading}
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors ${
                                uploading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.id === category.id ? (
                        <textarea
                          value={editingCategory.description || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="number"
                          value={editingCategory.display_order}
                          onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{category.display_order}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.id === category.id ? (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingCategory.is_active}
                            onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-900">Active</span>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {editingCategory?.id === category.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateCategory(editingCategory)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCategory(category)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProductCreated={handleProductCreated}
      />

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bracelets, Rings, Necklaces"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Category description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newCategory.display_order}
                  onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategoryModal(false);
                    setNewCategory({ name: '', description: '', display_order: 0 });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}