'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit, Eye, Settings, Package, ExternalLink, Trash2 } from 'lucide-react';
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
  created_at: string;
  updated_at?: string;
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'simple' | 'customizable'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);


  useEffect(() => {
    fetchProducts();
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
          <p className="text-zinc-600 mt-1">Manage your jewelry products and customization options</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </button>
      </div>

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.base_price}
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

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}