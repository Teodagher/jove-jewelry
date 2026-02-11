'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CustomizationService } from '@/services/customizationService'
import {
  Mail,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronRight,
  FolderOpen,
  FileText,
  Eye,
  Code,
  Bold,
  Italic,
  Variable,
  Settings,
  Send,
} from 'lucide-react'

interface TemplateGroup {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

interface EmailTemplate {
  id: string
  group_id: string | null
  name: string
  slug: string
  subject: string
  body: string
  variables: { key: string; label: string; category: string }[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EmailTemplatesPage() {
  const [groups, setGroups] = useState<TemplateGroup[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [rightView, setRightView] = useState<'preview' | 'editor'>('preview')

  // Editor state
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editGroupId, setEditGroupId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Group creation
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupSlug, setNewGroupSlug] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Test Email State
  const [showTestModal, setShowTestModal] = useState(false)
  const [testRecipient, setTestRecipient] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  // Real Order Preview State
  const [previewOrderId, setPreviewOrderId] = useState('')
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [jewelryItems, setJewelryItems] = useState<any[]>([])
  const [realOrderVariables, setRealOrderVariables] = useState<Record<string, string> | null>(null)

  // Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [senderEmail, setSenderEmail] = useState('')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/email/templates')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
        setTemplates(data.templates || [])
      }

      // Fetch recent orders for preview
      const { data: ordersData } = await (supabase
        .from('orders') as any)
        .select('id, order_number, customer_name, customer_email, total, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      if (ordersData) setAllOrders(ordersData)

      // Fetch jewelry items for image fallbacks
      const { data: itemsData } = await (supabase
        .from('jewelry_items') as any)
        .select('id, name, type, base_image_url')
      if (itemsData) setJewelryItems(itemsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Load sender email from local storage
    const savedSender = localStorage.getItem('admin_sender_email')
    if (savedSender) setSenderEmail(savedSender)
  }, [])

  const handleSaveSettings = () => {
    if (!senderEmail) {
      showToast('Please enter a sender email', 'error')
      return
    }
    localStorage.setItem('admin_sender_email', senderEmail)
    setShowSettingsModal(false)
    showToast('Settings saved')
  }

  const handleSendTest = async () => {
    if (!selectedTemplate) return
    if (!testRecipient) {
      showToast('Please enter a recipient email', 'error')
      return
    }
    if (!senderEmail) {
      showToast('Please configure sender email in settings', 'error')
      setShowTestModal(false)
      setShowSettingsModal(true)
      return
    }

    setSendingTest(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testRecipient,
          from: `Maison Jové <${senderEmail}>`,
          subject: `[TEST] ${resolvePreview(selectedTemplate.subject)}`,
          html: buildPreviewHtml(selectedTemplate.body),
        },
      })

      if (error) throw error
      showToast('Test email sent successfully')
      setShowTestModal(false)
    } catch (err: any) {
      console.error('Error sending test email:', err)
      showToast(err.message || 'Failed to send test email', 'error')
    } finally {
      setSendingTest(false)
    }
  }

  // Group templates by group_id
  const groupedTemplates = groups.map((group) => ({
    ...group,
    templates: templates.filter((t) => t.group_id === group.id),
  }))
  const ungroupedTemplates = templates.filter((t) => !t.group_id)

  // Sample order item HTML for preview
  const sampleOrderItemsHtml = `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;border-collapse:collapse;">
<tr>
  <td style="width:90px;vertical-align:top;padding:0;">
    <div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;overflow:hidden;border-radius:8px 0 0 8px;">
      <img src="https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1762173385426-img_0781-removebg-preview-te7dwf5nf8.webp" alt="Necklace" style="width:100%;height:100%;object-fit:contain;display:block;">
    </div>
  </td>
  <td style="vertical-align:top;padding:12px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;padding:0 0 4px;">Custom Gold Necklace</td>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;text-align:right;white-space:nowrap;padding:0 0 4px;">$160.00</td>
    </tr>
    <tr><td colspan="2" style="font-size:11px;color:#999;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;"><span style="color:#888;">Metal:</span> Yellow Gold &middot; <span style="color:#888;">Stone:</span> Diamond &middot; <span style="color:#888;">Chain:</span> Gold Cord</td></tr>
    </table>
  </td>
</tr>
</table>
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;border-collapse:collapse;">
<tr>
  <td style="width:90px;vertical-align:top;padding:0;">
    <div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;overflow:hidden;border-radius:8px 0 0 8px;">
      <img src="https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1770076090240-3b987adf-cc7a-418b-901f-f7db85ca50cb-4jcpfx6wjqv.webp" alt="Bracelet" style="width:100%;height:100%;object-fit:contain;display:block;">
    </div>
  </td>
  <td style="vertical-align:top;padding:12px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;padding:0 0 4px;">Custom Bracelet</td>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;text-align:right;white-space:nowrap;padding:0 0 4px;">$160.00</td>
    </tr>
    <tr><td colspan="2" style="font-size:11px;color:#999;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;"><span style="color:#888;">Metal:</span> Silver &middot; <span style="color:#888;">Cord:</span> Black Leather</td></tr>
    </table>
  </td>
</tr>
</table>`

  // Helper to build order items HTML
  const buildRealOrderItemsHtml = async (items: any[]): Promise<string> => {
    const renderedItems = await Promise.all(items.map(async (item) => {
      // Intelligently generate the variant image URL based on customization data
      let displayImageUrl = item.preview_image_url

      if (!displayImageUrl && item.jewelry_type) {
        const product = jewelryItems.find(p => p.id === item.jewelry_type)
        if (product && item.customization_data) {
          // Re-generate the URL using the same logic as the Customization page
          const generatedUrl = await CustomizationService.generateVariantImageUrl(
            product.type,
            item.customization_data
          )
          if (generatedUrl) {
            displayImageUrl = generatedUrl
          } else {
            // Fallback to base image only if generation fails
            displayImageUrl = product.base_image_url
          }
        } else if (product) {
          displayImageUrl = product.base_image_url
        }
      }

      return `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;border-collapse:collapse;">
        <tr>
          <td style="width:90px;vertical-align:top;padding:0;">
            <div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;overflow:hidden;border-radius:8px 0 0 8px;">
              ${displayImageUrl
          ? `<img src="${displayImageUrl}" alt="Product" style="width:100%;height:100%;object-fit:cover;display:block;">`
          : `<div style="width:90px;height:90px;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:24px;">&#9670;</div>`
        }
            </div>
          </td>
          <td style="vertical-align:top;padding:12px 16px;">
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;padding:0 0 4px;">
                  ${item.product_name || (jewelryItems.find(p => p.id === item.jewelry_type)?.name || 'Custom Jewelry')}
                  ${item.quantity > 1 ? `<span style="color:#888;font-weight:400;">x${item.quantity}</span>` : ''}
                </td>
                <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;text-align:right;white-space:nowrap;padding:0 0 4px;">
                  $${Number(item.total_price || item.base_price || 0).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size:11px;color:#999;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;">
                  ${item.customization_summary || ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `}))

    return renderedItems.join('')
  }

  const handleOrderPreviewChange = async (orderId: string) => {
    setPreviewOrderId(orderId)
    if (!orderId) {
      setRealOrderVariables(null)
      return
    }

    try {
      // Fetch full order details and items
      const { data: order } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('id', orderId)
        .single()

      const { data: items } = await (supabase
        .from('order_items') as any)
        .select('*')
        .eq('order_id', orderId)

      if (order) {
        setRealOrderVariables({
          '{{order_id}}': order.order_number || order.id.slice(0, 8),
          '{{order_number}}': order.order_number || order.id.slice(0, 8),
          '{{customer_name}}': order.customer_name || '',
          '{{customer_email}}': order.customer_email || '',
          '{{order_total}}': `$${Number(order.total || order.total_amount || 0).toFixed(2)}`,
          '{{subtotal}}': `$${Number(order.subtotal || 0).toFixed(2)}`,
          '{{delivery_fee}}': order.delivery_fee ? `$${Number(order.delivery_fee).toFixed(2)}` : 'Free',
          '{{payment_method}}': order.payment_method || 'N/A',
          '{{order_items_html}}': items ? await buildRealOrderItemsHtml(items) : '',
        })
      }
    } catch (err) {
      console.error('Error fetching order for preview:', err)
      showToast('Failed to load order data', 'error')
    }
  }

  // Preview variable values
  const currentVariables: Record<string, string> = realOrderVariables || {
    '{{order_id}}': 'JV-2026-0042',
    '{{order_number}}': 'JV-2026-0042',
    '{{customer_name}}': 'Sarah Johnson',
    '{{customer_email}}': 'sarah@example.com',
    '{{order_total}}': '$320.00',
    '{{subtotal}}': '$320.00',
    '{{delivery_fee}}': 'Free',
    '{{payment_method}}': 'Cash on Delivery',
    '{{discount_code}}': '',
    '{{discount_amount}}': '',
    '{{order_items}}': '1x Custom Gold Necklace — $160.00\n1x Diamond Bracelet — $160.00',
    '{{order_items_html}}': sampleOrderItemsHtml,
  }

  const resolvePreview = (text: string): string => {
    let resolved = text

    // Handle {{#if variable}}...{{/if}} conditionals
    resolved = resolved.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
      const key = `{{${varName}}}`
      const value = currentVariables[key]
      return value && value.trim() ? content : ''
    })

    for (const [key, value] of Object.entries(currentVariables)) {
      resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    return resolved
  }

  const isFullHtml = (text: string): boolean => {
    return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
  }

  const buildPreviewHtml = (bodyText: string): string => {
    const resolved = resolvePreview(bodyText)

    // If template is already full HTML, return it directly
    if (isFullHtml(resolved)) {
      return resolved
    }

    // Otherwise wrap in default email shell
    const htmlBody = resolved.replace(/\n/g, '<br>')
    return `<div style="background-color:#f7f5f3;padding:24px 0;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;">
<div style="text-align:center;padding:32px 24px;background-color:#ffffff;border-radius:12px 12px 0 0;">
<span style="font-size:28px;letter-spacing:0.2em;color:#1a1a1a;font-weight:300;">MAISON JOVÉ</span>
<div style="width:40px;height:1px;background-color:#c9a96e;margin:16px auto 0;"></div>
</div>
<div style="background-color:#ffffff;padding:32px 28px;font-size:14px;line-height:1.7;color:#333333;">
${htmlBody}
</div>
<div style="text-align:center;padding:20px 24px;background-color:#faf8f5;border-radius:0 0 12px 12px;border-top:1px solid #e8e4de;">
<p style="font-size:11px;color:#999;margin:0;letter-spacing:0.05em;">Maison Jové — Custom Jewelry</p>
</div>
</div>
</div>`
  }

  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t)
    setRightView('preview')
    setIsCreating(false)
  }

  const handleNewTemplate = (groupId?: string) => {
    setEditName('')
    setEditSlug('')
    setEditSubject('')
    setEditBody('')
    setEditGroupId(groupId || null)
    setIsCreating(true)
    setSelectedTemplate(null)
    setRightView('editor')
  }

  const handleEditTemplate = () => {
    if (!selectedTemplate) return
    setEditName(selectedTemplate.name)
    setEditSlug(selectedTemplate.slug)
    setEditSubject(selectedTemplate.subject)
    setEditBody(selectedTemplate.body)
    setEditGroupId(selectedTemplate.group_id)
    setRightView('editor')
    setIsCreating(false)
  }

  const handleSave = async () => {
    if (!editName || !editSlug || !editSubject || !editBody) {
      showToast('Please fill in all fields', 'error')
      return
    }
    setSaving(true)
    try {
      if (isCreating) {
        const res = await fetch('/api/admin/email/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName,
            slug: editSlug,
            subject: editSubject,
            bodyContent: editBody,
            group_id: editGroupId,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create')
        }
        showToast('Template created')
      } else if (selectedTemplate) {
        const res = await fetch('/api/admin/email/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedTemplate.id,
            name: editName,
            subject: editSubject,
            bodyContent: editBody,
            group_id: editGroupId,
          }),
        })
        if (!res.ok) throw new Error('Failed to update')
        showToast('Template saved')
      }
      await fetchData()
      setRightView('preview')
      setIsCreating(false)
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return
    if (!confirm('Delete this template permanently?')) return
    try {
      const res = await fetch('/api/admin/email/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplate.id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      showToast('Template deleted')
      setSelectedTemplate(null)
      await fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName || !newGroupSlug) return
    setSavingGroup(true)
    try {
      const res = await fetch('/api/admin/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'group', name: newGroupName, slug: newGroupSlug }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create group')
      }
      showToast('Group created')
      setNewGroupName('')
      setNewGroupSlug('')
      setShowGroupForm(false)
      await fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? Templates will be moved to ungrouped.')) return
    try {
      const res = await fetch('/api/admin/email/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, type: 'group' }),
      })
      if (!res.ok) throw new Error('Failed to delete group')
      showToast('Group deleted')
      await fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  const insertVariable = (varKey: string) => {
    const textarea = bodyRef.current
    if (!textarea) {
      setEditBody((prev) => prev + varKey)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newBody = editBody.substring(0, start) + varKey + editBody.substring(end)
    setEditBody(newBody)
    setTimeout(() => {
      textarea.focus()
      const pos = start + varKey.length
      textarea.setSelectionRange(pos, pos)
    }, 0)
  }

  const wrapWithTag = (tag: string) => {
    const textarea = bodyRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editBody.substring(start, end)
    const openTag = `<${tag}>`
    const closeTag = `</${tag}>`
    const wrapped = openTag + selected + closeTag
    const newBody = editBody.substring(0, start) + wrapped + editBody.substring(end)
    setEditBody(newBody)
    setTimeout(() => {
      textarea.focus()
      if (selected) {
        textarea.setSelectionRange(start, start + wrapped.length)
      } else {
        const cursorPos = start + openTag.length
        textarea.setSelectionRange(cursorPos, cursorPos)
      }
    }, 0)
  }

  // Collect all available variables from templates
  const availableVariables = selectedTemplate?.variables?.length
    ? selectedTemplate.variables
    : [
      { key: '{{order_id}}', label: 'Order ID', category: 'Order' },
      { key: '{{customer_name}}', label: 'Customer Name', category: 'Customer' },
      { key: '{{customer_email}}', label: 'Customer Email', category: 'Customer' },
      { key: '{{order_total}}', label: 'Order Total', category: 'Order' },
      { key: '{{order_items}}', label: 'Order Items', category: 'Order' },
    ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-900"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-light text-zinc-900 tracking-wide">Email Templates</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage email templates organized by groups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setShowGroupForm(!showGroupForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            New Group
          </button>
          <button
            onClick={() => handleNewTemplate()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* New Group Form */}
      {showGroupForm && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value)
                setNewGroupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
            />
            <input
              type="text"
              placeholder="slug"
              value={newGroupSlug}
              onChange={(e) => setNewGroupSlug(e.target.value)}
              className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 font-mono text-xs"
            />
            <button
              onClick={handleCreateGroup}
              disabled={savingGroup || !newGroupName || !newGroupSlug}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {savingGroup ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowGroupForm(false); setNewGroupName(''); setNewGroupSlug('') }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-0 min-h-[calc(100vh-220px)] border border-gray-200 rounded-xl overflow-hidden bg-white">

        {/* LEFT PANEL — Template List */}
        <div className="w-80 min-w-[320px] border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">Templates</span>
            <span className="text-xs text-zinc-400">{templates.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {groupedTemplates.map((group) => (
              <div key={group.id}>
                {/* Group Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNewTemplate(group.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                      title="Add template to group"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Templates in group */}
                {group.templates.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-zinc-400 italic">No templates in this group</div>
                ) : (
                  group.templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${selectedTemplate?.id === t.id
                        ? 'bg-zinc-50 border-l-[3px] border-l-zinc-900'
                        : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-zinc-900 truncate">{t.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate ml-[22px]">{t.subject}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 ml-[22px]">
                        <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">{t.slug}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ))}

            {/* Ungrouped templates */}
            {ungroupedTemplates.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ungrouped</span>
                </div>
                {ungroupedTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${selectedTemplate?.id === t.id
                      ? 'bg-zinc-50 border-l-[3px] border-l-zinc-900'
                      : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-zinc-900 truncate">{t.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate ml-[22px]">{t.subject}</p>
                  </button>
                ))}
              </div>
            )}

            {templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Mail className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-zinc-500 font-medium">No templates yet</p>
                <p className="text-xs text-zinc-400 mt-1">Create your first email template</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedTemplate && !isCreating ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Mail className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                <p className="text-zinc-500 font-medium">Select a template to preview</p>
                <p className="text-sm text-zinc-400 mt-1">or create a new one to get started</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">
                  {isCreating ? 'New Template' : (selectedTemplate?.name || 'Template Details')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-zinc-700 rounded-lg hover:bg-gray-50 transition-colors mr-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Test
                  </button>
                  {!isCreating && (
                    <>
                      <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setRightView('preview')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${rightView === 'preview' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>
                        <button
                          onClick={handleEditTemplate}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${rightView === 'editor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                          <Code className="w-3.5 h-3.5" />
                          Editor
                        </button>
                      </div>
                      <button
                        onClick={handleDelete}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {rightView === 'preview' && selectedTemplate ? (
                  <div>
                    {/* Preview Variables */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Preview Variables</p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableVariables.map((v) => (
                            <span
                              key={v.key}
                              className="inline-flex px-2 py-1 text-[11px] font-medium bg-gray-50 text-zinc-600 rounded border border-gray-100"
                            >
                              {v.label}: <span className="ml-1 font-normal text-zinc-400 truncate max-w-[120px]">{currentVariables[v.key] || '—'}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 px-4 border-l border-gray-200">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Preview Source</label>
                        <select
                          value={previewOrderId}
                          onChange={(e) => handleOrderPreviewChange(e.target.value)}
                          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900/10 min-w-[200px]"
                        >
                          <option value="">Sample Data</option>
                          {allOrders.map(o => (
                            <option key={o.id} value={o.id}>
                              Order #{o.order_number || o.id.slice(0, 8)} — {o.customer_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Email Preview */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Preview</p>
                        <p className="text-xs text-zinc-400">
                          Subject: <span className="font-semibold text-zinc-600">{resolvePreview(selectedTemplate.subject)}</span>
                        </p>
                      </div>
                      <div
                        className="border border-gray-200 rounded-lg overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: buildPreviewHtml(selectedTemplate.body) }}
                      />
                    </div>
                  </div>
                ) : (
                  /* EDITOR MODE */
                  <div className="p-5">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Template Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => {
                              setEditName(e.target.value)
                              if (isCreating) {
                                setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''))
                              }
                            }}
                            placeholder="e.g. Order Confirmation - Client"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Slug</label>
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            placeholder="orderconfirmation_client"
                            disabled={!isCreating}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 font-mono text-xs disabled:bg-gray-50 disabled:text-zinc-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Group</label>
                        <select
                          value={editGroupId || ''}
                          onChange={(e) => setEditGroupId(e.target.value || null)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                        >
                          <option value="">No group</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Subject</label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          placeholder="e.g. Your Order Confirmation - #{{order_id}}"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                        />
                      </div>

                      {/* Variable Badges */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Insert Variables</label>
                        <div className="flex flex-wrap gap-1.5">
                          {availableVariables.map((v) => (
                            <button
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Variable className="w-3 h-3" />
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Body Editor */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Body</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:border-zinc-400">
                          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                            <button
                              onClick={() => wrapWithTag('b')}
                              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                              title="Bold"
                            >
                              <Bold className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                            <button
                              onClick={() => wrapWithTag('i')}
                              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                              title="Italic"
                            >
                              <Italic className="w-3.5 h-3.5 text-zinc-500" />
                            </button>
                            <span className="text-[10px] text-zinc-400 ml-2">Select text, then click to format</span>
                          </div>
                          <textarea
                            ref={bodyRef}
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={14}
                            placeholder="Write your email body here. Use variables like {{customer_name}} to personalize."
                            className="w-full px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        {!isCreating && (
                          <button
                            onClick={() => setRightView('preview')}
                            className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={handleSave}
                          disabled={saving || !editName || !editSlug || !editSubject || !editBody}
                          className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : isCreating ? 'Create Template' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>


      {/* Settings Modal */}
      {
        showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Email Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Sender Email</label>
                  <p className="text-xs text-zinc-500 mb-2">The email address that will appear in the "From" field. Must be verified with Resend.</p>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="e.g. notifications@yourdomain.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Test Email Modal */}
      {
        showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Send Test Email</h3>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="e.g. your@email.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                  />
                </div>

                <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
                  <p className="font-medium mb-1">Sending from: <span className="font-mono">{senderEmail || '(Not configured)'}</span></p>
                  <p className="text-xs opacity-80">Make sure this domain is verified with Resend.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest || !testRecipient || !senderEmail}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {sendingTest ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendingTest ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
