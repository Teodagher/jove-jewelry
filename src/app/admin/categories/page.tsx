'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Upload, X, ChevronRight, Menu } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  parent_id: string | null
  show_in_menu: boolean
  created_at: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    parent_id: '',
    show_in_menu: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  // Get parent categories (categories without a parent)
  const parentCategories = categories.filter(c => !c.parent_id)
  
  // Get children for a parent
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  function openAddModal(parentId?: string) {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      parent_id: parentId || '',
      show_in_menu: true
    })
    setShowModal(true)
  }

  function openEditModal(category: Category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active,
      parent_id: category.parent_id || '',
      show_in_menu: category.show_in_menu ?? true
    })
    setShowModal(true)
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `categories/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('categories-pictures')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert('Failed to upload image')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('categories-pictures')
      .getPublicUrl(filePath)

    setFormData(prev => ({ ...prev, image_url: publicUrl }))
    setUploading(false)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Please enter a category name')
      return
    }

    setSaving(true)

    const slug = formData.slug || generateSlug(formData.name)
    
    const categoryData: {
      name: string
      slug: string
      description: string | null
      image_url: string | null
      is_active: boolean
      parent_id: string | null
      show_in_menu: boolean
      display_order?: number
    } = {
      name: formData.name.trim(),
      slug: slug,
      description: formData.description.trim() || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      parent_id: formData.parent_id || null,
      show_in_menu: formData.show_in_menu
    }

    if (editingCategory) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('product_categories')
        .update(categoryData)
        .eq('id', editingCategory.id)

      if (error) {
        console.error('Update error:', error)
        alert('Failed to update category')
      }
    } else {
      // Create new - get max display_order first
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.display_order)) 
        : -1

      categoryData.display_order = maxOrder + 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('product_categories')
        .insert(categoryData)

      if (error) {
        console.error('Insert error:', error)
        alert('Failed to create category')
      }
    }

    setSaving(false)
    setShowModal(false)
    fetchCategories()
  }

  async function handleDelete(category: Category) {
    // Check if it has children
    const children = getChildren(category.id)
    if (children.length > 0) {
      alert(`Cannot delete "${category.name}" because it has ${children.length} sub-categories. Delete them first.`)
      return
    }
    
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', category.id)

    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete category. It may have products attached.')
    } else {
      fetchCategories()
    }
  }

  async function toggleActive(category: Category) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('product_categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    if (error) {
      console.error('Toggle error:', error)
    } else {
      fetchCategories()
    }
  }

  async function toggleShowInMenu(category: Category) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('product_categories')
      .update({ show_in_menu: !category.show_in_menu })
      .eq('id', category.id)

    if (error) {
      console.error('Toggle error:', error)
    } else {
      fetchCategories()
    }
  }

  // Render a category row
  function CategoryRow({ category, isChild = false }: { category: Category, isChild?: boolean }) {
    const children = getChildren(category.id)
    
    return (
      <>
        <tr className={`hover:bg-gray-50 ${isChild ? 'bg-gray-50/50' : ''}`}>
          <td className="px-4 py-3">
            {isChild && <div className="w-6 border-l-2 border-b-2 border-gray-200 h-4 ml-2 rounded-bl" />}
          </td>
          <td className="px-4 py-3">
            {category.image_url ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No img</span>
              </div>
            )}
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              {!isChild && children.length > 0 && (
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                  {children.length} sub
                </span>
              )}
              <span className={`font-medium ${isChild ? 'text-gray-700' : 'text-gray-900'}`}>
                {category.name}
              </span>
            </div>
          </td>
          <td className="px-4 py-3">
            <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {category.slug}
            </code>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(category)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  category.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {category.is_active ? (
                  <>
                    <Eye className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Hidden
                  </>
                )}
              </button>
            </div>
          </td>
          <td className="px-4 py-3">
            <button
              onClick={() => toggleShowInMenu(category)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                category.show_in_menu
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Menu className="w-3 h-3" />
              {category.show_in_menu ? 'In Menu' : 'Not in Menu'}
            </button>
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-2">
              {!isChild && (
                <button
                  onClick={() => openAddModal(category.id)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Add sub-category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => openEditModal(category)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        {/* Render children */}
        {children.map(child => (
          <CategoryRow key={child.id} category={child} isChild />
        ))}
      </>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-light text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-600">Manage product categories and menu structure</p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Parent Category
        </button>
      </div>

      {/* Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Parent categories</strong> (like &ldquo;Fine Jewellery&rdquo;) group sub-categories together. 
          Categories marked &ldquo;In Menu&rdquo; will appear in the website sidebar.
        </p>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No categories yet</p>
          <button
            onClick={() => openAddModal()}
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parentCategories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {editingCategory ? 'Edit Category' : formData.parent_id ? 'Add Sub-Category' : 'Add Parent Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Parent selector (only for editing or if not pre-set) */}
              {(editingCategory || !formData.parent_id) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">None (Top-level category)</option>
                    {parentCategories
                      .filter(c => c.id !== editingCategory?.id) // Can't be parent of itself
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Leave empty for a top-level parent category</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="e.g. Fine Jewellery"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="auto-generated"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly name (auto-generated if empty)</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Image
                </label>
                {formData.image_url ? (
                  <div className="relative">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={formData.image_url}
                        alt="Category"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {uploading ? 'Uploading...' : 'Click to upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active (visible on site)
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="show_in_menu"
                    checked={formData.show_in_menu}
                    onChange={(e) => setFormData(prev => ({ ...prev, show_in_menu: e.target.checked }))}
                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <label htmlFor="show_in_menu" className="text-sm text-gray-700">
                    Show in website sidebar menu
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
