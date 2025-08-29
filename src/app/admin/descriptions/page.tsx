'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, FileText, Edit } from 'lucide-react'

interface ProductDescription {
  id: string
  product_type: string
  title: string | null
  description: string | null
  is_active: boolean
  updated_at: string
}

export default function ProductDescriptionsPage() {
  const [descriptions, setDescriptions] = useState<ProductDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const productTypes = [
    { type: 'necklaces', label: 'Necklaces', icon: '📿' },
    { type: 'rings', label: 'Rings', icon: '💍' },
    { type: 'bracelets', label: 'Bracelets', icon: '⚙️' },
    { type: 'earrings', label: 'Earrings', icon: '👂' },
  ]

  // Load descriptions
  const loadDescriptions = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('product_descriptions')
        .select('*')
        .order('product_type', { ascending: true })

      if (error) throw error

      setDescriptions(data || [])
    } catch (err) {
      console.error('Error loading descriptions:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDescriptions()
  }, [])

  // Update description
  const updateDescription = async (productType: string, title: string, description: string, isActive: boolean) => {
    try {
      setSaving(productType)
      const supabase = createClient()

      // Clean the data - if title or description is empty, set to null
      const cleanTitle = title.trim() || null
      const cleanDescription = description.trim() || null

      const { error } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('product_descriptions') as any)
        .update({
          title: cleanTitle,
          description: cleanDescription,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('product_type', productType)

      if (error) throw error

      // Reload descriptions to get latest data
      await loadDescriptions()
      
    } catch (err) {
      console.error('Error updating description:', err)
      setError((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, productType: string) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isActive = formData.get('is_active') === 'on'

    await updateDescription(productType, title, description, isActive)
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
          <p className="text-red-600 mb-4">Error loading descriptions: {error}</p>
          <button
            onClick={loadDescriptions}
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
          <p className="text-zinc-600 mt-1">Manage descriptions that appear on your product customization pages</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-zinc-500">
          <FileText className="h-4 w-4" />
          <span>{descriptions.filter(d => d.is_active && (d.title || d.description)).length} active descriptions</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How it works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Descriptions appear between the product image and the "Add to Cart" button</li>
          <li>• If both title and description are empty, nothing will be shown on the product page</li>
          <li>• Toggle "Active" to show/hide descriptions without deleting content</li>
          <li>• Use <code className="bg-blue-200 px-1 rounded">{"{selected-stone-size}"}</code> to dynamically show the selected stone size (e.g., 0.15ct, 0.30ct, 0.50ct)</li>
          <li>• Changes are applied immediately to your website</li>
        </ul>
      </div>

      {/* Description Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {productTypes.map((productType) => {
          const description = descriptions.find(d => d.product_type === productType.type)
          const isBeingSaved = saving === productType.type

          return (
            <div key={productType.type} className="bg-white rounded-lg border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{productType.icon}</div>
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900">{productType.label}</h3>
                    <p className="text-sm text-zinc-500">Customize page description</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {description?.is_active ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Visible</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-sm">Hidden</span>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={(e) => handleSubmit(e, productType.type)} className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor={`title-${productType.type}`} className="block text-sm font-medium text-zinc-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    id={`title-${productType.type}`}
                    name="title"
                    defaultValue={description?.title || ''}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    placeholder={`Enter title for ${productType.label.toLowerCase()}...`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor={`desc-${productType.type}`} className="block text-sm font-medium text-zinc-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id={`desc-${productType.type}`}
                    name="description"
                    rows={4}
                    defaultValue={description?.description || ''}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    placeholder={`Enter description for ${productType.label.toLowerCase()}...`}
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`active-${productType.type}`}
                    name="is_active"
                    defaultChecked={description?.is_active}
                    className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-zinc-300 rounded"
                  />
                  <label htmlFor={`active-${productType.type}`} className="text-sm font-medium text-zinc-700">
                    Show on product page
                  </label>
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
              {description && (description.title || description.description) && description.is_active && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">PREVIEW:</h4>
                  <div className="space-y-2">
                    {description.title && (
                      <h5 className="font-medium text-gray-900">{description.title}</h5>
                    )}
                    {description.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{description.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}