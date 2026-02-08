'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CustomizationService } from '@/services/customizationService'
import {
  Send,
  ChevronDown,
  Bold,
  Italic,
  Variable,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

interface TemplateGroup {
  id: string
  name: string
  slug: string
}

interface EmailTemplate {
  id: string
  group_id: string | null
  name: string
  slug: string
  subject: string
  body: string
  variables: { key: string; label: string; category: string }[]
}

interface HistoryItem {
  id: string
  template_id: string | null
  to_email: string
  to_name: string | null
  subject: string
  status: 'sent' | 'failed' | 'pending'
  error_message: string | null
  sent_at: string
}

interface OrderOption {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  created_at: string
}

export default function SendEmailPage() {
  const [groups, setGroups] = useState<TemplateGroup[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [orders, setOrders] = useState<OrderOption[]>([])
  const [jewelryItems, setJewelryItems] = useState<any[]>([])
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [toName, setToName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [resolvedSubject, setResolvedSubject] = useState('')
  const [sending, setSending] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // View toggle
  const [view, setView] = useState<'compose' | 'history'>('compose')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [templatesRes, historyRes] = await Promise.all([
        fetch('/api/admin/email/templates'),
        fetch('/api/admin/email/history'),
      ])
      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setGroups(data.groups || [])
        setTemplates(data.templates || [])
      }
      if (historyRes.ok) {
        setHistory(await historyRes.json())
      }

      // Fetch recent orders for the order selector
      const { supabase } = await import('@/lib/supabase/client')
      const { data: ordersData } = await (supabase
        .from('orders') as any)
        .select('id, order_number, customer_name, customer_email, total, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (ordersData) setOrders(ordersData)

      // Fetch jewelry items for fallbacks
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
  }, [])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id)
    const tmpl = templates.find((t) => t.id === id)
    if (tmpl) {
      setSubject(tmpl.subject)
      setBody(tmpl.body)
    } else {
      setSubject('')
      setBody('')
    }
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null

  const handleOrderChange = async (orderId: string) => {
    setSelectedOrderId(orderId)
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      setToEmail(order.customer_email)
      setToName(order.customer_name)

      // Fetch items for preview
      const { supabase } = await import('@/lib/supabase/client')
      const { data: items } = await (supabase
        .from('order_items') as any)
        .select('*')
        .eq('order_id', orderId)
      if (items) setSelectedOrderItems(items)
    } else {
      setSelectedOrderItems([])
    }
  }

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

  const buildVariables = async (): Promise<Record<string, string>> => {
    return {
      '{{customer_name}}': toName || '',
      '{{customer_email}}': toEmail || '',
      '{{order_id}}': selectedOrder?.order_number || '',
      '{{order_number}}': selectedOrder?.order_number || '',
      '{{order_total}}': selectedOrder ? `$${Number(selectedOrder.total).toFixed(2)}` : '',
      '{{subtotal}}': selectedOrder ? `$${Number(selectedOrder.total).toFixed(2)}` : '',
      '{{delivery_fee}}': 'Free',
      '{{payment_method}}': '',
      '{{discount_code}}': '',
      '{{discount_amount}}': '',
      '{{order_items}}': '',
      '{{order_items_html}}': selectedOrderItems.length > 0
        ? await buildRealOrderItemsHtml(selectedOrderItems)
        : (selectedOrder ? '<p style="font-size:12px;color:#999;font-style:italic;">Loading items...</p>' : ''),
    }
  }

  const resolveText = async (text: string): Promise<string> => {
    const vars = await buildVariables()
    let resolved = text

    // Handle {{#if variable}}...{{/if}} conditionals
    resolved = resolved.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
      const key = `{{${varName}}}`
      const value = vars[key]
      return value && value.trim() ? content : ''
    })

    for (const [key, value] of Object.entries(vars)) {
      resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    return resolved
  }

  const isFullHtml = (text: string): boolean => {
    return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
  }

  useEffect(() => {
    const updatePreview = async () => {
      // Resolve subject
      const resSubject = await resolveText(subject)
      setResolvedSubject(resSubject)

      // Resolve body
      const resolved = await resolveText(body || selectedTemplate?.body || '')
      if (isFullHtml(resolved)) {
        setPreviewHtml(resolved)
      } else {
        const htmlBody = resolved.replace(/\n/g, '<br>')
        setPreviewHtml(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { margin: 0; padding: 0; font-family: Georgia,'Times New Roman',serif; background-color: #f7f5f3; }
                .email-container { max-width:600px; margin:0 auto; }
                .header { text-align:center;padding:32px 24px;background-color:#ffffff;border-radius:12px 12px 0 0; }
                .logo { font-size:28px;letter-spacing:0.2em;color:#1a1a1a;font-weight:300; }
                .divider { width:40px;height:1px;background-color:#c9a96e;margin:16px auto 0; }
                .content { background-color:#ffffff;padding:32px 28px;font-size:14px;line-height:1.7;color:#333333; }
                .footer { text-align:center;padding:20px 24px;background-color:#faf8f5;border-radius:0 0 12px 12px;border-top:1px solid #e8e4de; }
                .footer-text { font-size:11px;color:#999;margin:0;letter-spacing:0.05em; }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <span class="logo">MAISON JOVÉ</span>
                  <div class="divider"></div>
                </div>
                <div class="content">
                  ${htmlBody}
                </div>
                <div class="footer">
                  <p class="footer-text">Maison Jové — Custom Jewelry</p>
                </div>
              </div>
            </body>
          </html>
        `)
      }
    }
    updatePreview()
  }, [body, subject, selectedTemplate, selectedOrderItems, toName, toEmail, jewelryItems])

  const handleSend = async () => {
    if (!toEmail || !subject || !body) {
      showToast('Please fill in recipient email, subject, and body', 'error')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: toEmail,
          to_name: toName,
          subject,
          bodyContent: body,
          template_id: selectedTemplateId || undefined,
          order_id: selectedOrderId || undefined,
          variables: await buildVariables(), // Await buildVariables here
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send')
      }
      showToast(`Email sent to ${toEmail}`)
      // Reset form
      setToEmail('')
      setToName('')
      setSelectedTemplateId('')
      setSelectedOrderId('')
      setSubject('')
      setBody('')
      // Refresh history
      fetchData()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  const availableVariables = selectedTemplate?.variables?.length
    ? selectedTemplate.variables
    : [
      { key: '{{order_id}}', label: 'Order ID', category: 'Order' },
      { key: '{{customer_name}}', label: 'Customer Name', category: 'Customer' },
      { key: '{{customer_email}}', label: 'Customer Email', category: 'Customer' },
      { key: '{{order_total}}', label: 'Order Total', category: 'Order' },
      { key: '{{order_items}}', label: 'Order Items', category: 'Order' },
    ]

  const insertVariable = (varKey: string) => {
    const textarea = bodyRef.current
    if (!textarea) {
      setBody((prev) => prev + varKey)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newBody = body.substring(0, start) + varKey + body.substring(end)
    setBody(newBody)
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
    const selected = body.substring(start, end)
    const openTag = `<${tag}>`
    const closeTag = `</${tag}>`
    const wrapped = openTag + selected + closeTag
    const newBody = body.substring(0, start) + wrapped + body.substring(end)
    setBody(newBody)
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

  const canSend = toEmail && subject && body

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Group templates by group for the dropdown
  const templatesByGroup = groups.map((g) => ({
    ...g,
    templates: templates.filter((t) => t.group_id === g.id),
  }))
  const ungrouped = templates.filter((t) => !t.group_id)

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
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin/email" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-serif font-light text-zinc-900 tracking-wide">Send Email</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-8">Compose and send emails using your templates</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('compose')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${view === 'compose' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            <Send className="w-3.5 h-3.5" />
            Compose
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors ${view === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            History ({history.length})
          </button>
        </div>
      </div>

      {view === 'history' ? (
        /* HISTORY VIEW */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-zinc-900">Send History</span>
            <span className="text-xs text-zinc-400 ml-2">{history.length} email{history.length !== 1 ? 's' : ''} sent</span>
          </div>
          {history.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No emails sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((h) => {
                const tmpl = templates.find((t) => t.id === h.template_id)
                return (
                  <div key={h.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {h.status === 'sent' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 truncate">
                          {h.to_name || h.to_email}
                        </span>
                        {h.to_name && (
                          <span className="text-xs text-zinc-400 truncate">{h.to_email}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">{h.subject}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {tmpl && (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded mb-0.5">
                          {tmpl.name}
                        </span>
                      )}
                      <p className="text-[11px] text-zinc-400">{formatDate(h.sent_at)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded ${h.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {h.status === 'sent' ? 'Sent' : 'Failed'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* COMPOSE VIEW */
        <div className="flex gap-0 min-h-[calc(100vh-220px)] border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* LEFT — Form */}
          <div className="w-1/2 min-w-0 border-r border-gray-200 flex flex-col">
            <div className="px-5 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-zinc-900">Compose</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Recipient</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                  />
                  <input
                    type="text"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    placeholder="Recipient Name"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Order Selection (optional) */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Link to Order <span className="normal-case font-normal">(optional — auto-fills recipient &amp; items)</span></label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                >
                  <option value="">No order linked</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.order_number || o.id.slice(0, 8)} — {o.customer_name} — ${Number(o.total).toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedOrder && (
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    Items with thumbnails will be auto-populated when sent.
                  </p>
                )}
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                >
                  <option value="">Select a template...</option>
                  {templatesByGroup.map((g) =>
                    g.templates.length > 0 && (
                      <optgroup key={g.id} label={g.name}>
                        {g.templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    )
                  )}
                  {ungrouped.length > 0 && (
                    <optgroup label="Ungrouped">
                      {ungrouped.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                />
              </div>

              {/* Variables */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Insert Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Variable className="w-3 h-3" />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Message</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:border-zinc-400">
                  <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                    <button onClick={() => wrapWithTag('b')} className="p-1.5 rounded hover:bg-gray-200 transition-colors" title="Bold">
                      <Bold className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                    <button onClick={() => wrapWithTag('i')} className="p-1.5 rounded hover:bg-gray-200 transition-colors" title="Italic">
                      <Italic className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  </div>
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="Select a template or write your message..."
                    className="w-full px-3 py-2.5 text-sm leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Send button */}
            <div className="p-5 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending || !canSend}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>

          {/* RIGHT — Live Preview */}
          <div className="w-1/2 min-w-0 flex flex-col bg-gray-50">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-900">Preview</span>
              </div>
              {subject && (
                <p className="text-xs text-zinc-400">
                  Subject: <span className="font-semibold text-zinc-600">{resolvedSubject}</span>
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!subject && !body ? (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center">
                    <Send className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500 font-medium">Select a template to see a preview</p>
                    <p className="text-xs text-zinc-400 mt-1">The preview will update live as you edit</p>
                  </div>
                </div>
              ) : (
                <div
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
