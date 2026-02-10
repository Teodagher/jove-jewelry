'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, FileText, Edit } from 'lucide-react'

interface JewelryProduct {
  id: string
  name: string
  type: string
  slug: string
  description: string | null
  is_active: boolean
  base_image_url: string | null
  display_order: number
}

export default function ProductDescriptionsPage() {
  const [products, setProducts] = useState<JewelryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('jewelry_items')
        .select('id, name, type, slug, description, is_active, base_image_url, display_order')
        .order('display_order', { ascending: true })

      if (error) throw error

      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Update product description
  const updateDescription = async (productId: string, description: string) => {
    try {
      setSaving(productId)

      // Clean the data - if description is empty, set to null
      const cleanDescription = description.trim() || null

      const { error } = await (supabase as any)
        .from('jewelry_items')
        .update({
          description: cleanDescription
        })
        .eq('id', productId)

      if (error) throw error

      // Reload products to get latest data
      await loadProducts()

    } catch (err) {
      console.error('Error updating description:', err)
      setError((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, productId: string) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const description = formData.get('description') as string

    await updateDescription(productId, description)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading products: {error}</p>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-zinc-900">Product Descriptions</h1>
          <p className="text-zinc-600 mt-1">Manage descriptions for all your jewelry products</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-zinc-500">
          <FileText className="h-4 w-4" />
          <span>{products.filter(p => p.description && p.description.trim()).length} products with descriptions</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Descriptions appear on the product customization page</li>
          <li>• Each product can have its own unique description</li>
          <li>• Leave description empty if you don't want to show any text</li>
          <li>• Changes are saved immediately to your database</li>
          <li>• Both active and inactive products are shown here</li>
        </ul>
      </div>

      {/* Product Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => {
          const isBeingSaved = saving === product.id

          return (
            <div key={product.id} className="bg-white rounded-lg border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {product.base_image_url ? (
                    <img src={product.base_image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900">{product.name}</h3>
                    <p className="text-sm text-zinc-500">{product.slug}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {product.is_active ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-sm">Inactive</span>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => handleSubmit(e, product.id)} className="space-y-4">
                {/* Description */}
                <div>
                  <label htmlFor={`desc-${product.id}`} className="block text-sm font-medium text-zinc-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    id={`desc-${product.id}`}
                    name="description"
                    rows={5}
                    defaultValue={product.description || ''}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    placeholder={`Enter description for ${product.name}...`}
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isBeingSaved}
                  className="w-full flex items-center justify-center space-x-2 bg-zinc-900 text-white py-2 px-4 rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isBeingSaved ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>

              {/* Preview */}
              {product.description && product.description.trim() && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">PREVIEW:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Create products in Product Management to add descriptions.</p>
        </div>
      )}
    </div>
  )
}