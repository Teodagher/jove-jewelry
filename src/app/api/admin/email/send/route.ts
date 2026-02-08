import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { CustomizationService } from '@/services/customizationService'

// Lazy initialize Resend to avoid build-time errors
let resendInstance: Resend | null = null
function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', status: 401 }

  const { data: userData } = await (supabase
    .from('users') as any)
    .select('roles')
    .eq('auth_user_id', user.id)
    .single() as { data: { roles: string[] | null } | null }

  if (!userData?.roles?.includes('admin')) return { error: 'Forbidden', status: 403 }
  return { user, supabase }
}

function resolveVariables(text: string, variables: Record<string, string>): string {
  let resolved = text

  // Handle {{#if variable}}...{{/if}} conditionals
  resolved = resolved.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    const key = `{{${varName}}}`
    const value = variables[key]
    return value && value.trim() ? content : ''
  })

  // Replace variables
  for (const [key, value] of Object.entries(variables)) {
    resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return resolved
}

function isFullHtml(text: string): boolean {
  return text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')
}

function buildHtmlEmail(bodyText: string): string {
  // If the template is already full HTML, use it as-is
  if (isFullHtml(bodyText)) {
    return bodyText
  }

  // Otherwise wrap in a default email shell
  const htmlBody = bodyText.replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f5f3;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
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
</body>
</html>`
}

// Build HTML for a single order item card with thumbnail
function buildOrderItemHtml(item: {
  product_name?: string
  jewelry_type?: string
  customization_summary?: string
  preview_image_url?: string
  quantity?: number
  total_price?: number
  base_price?: number
}): string {
  const name = item.product_name || formatJewelryType(item.jewelry_type || 'Jewelry')
  const imgUrl = item.preview_image_url || ''
  const summary = item.customization_summary || ''
  const qty = item.quantity || 1
  const price = item.total_price || item.base_price || 0

  // Clean up customization summary: "Key: Value • Key: Value" -> list
  const summaryParts = summary.split('•').map((s: string) => s.trim()).filter(Boolean)
  const summaryHtml = summaryParts.length > 0
    ? summaryParts.map((part: string) => {
      const [label, ...rest] = part.split(':')
      const value = rest.join(':').trim()
      if (value) {
        return `<span style="color:#888;">${label.trim()}:</span> ${value}`
      }
      return part
    }).join(' &middot; ')
    : ''

  return `<div style="display:flex;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;">
  <div style="width:90px;min-width:90px;height:90px;background-color:#f5f3f0;">
    ${imgUrl
      ? `<img src="${imgUrl}" alt="${name}" style="width:90px;height:90px;object-fit:cover;display:block;" />`
      : `<div style="width:90px;height:90px;display:flex;align-items:center;justify-content:center;background-color:#f5f3f0;"><span style="font-size:24px;color:#ccc;">&#9670;</span></div>`
    }
  </div>
  <div style="padding:12px 16px;flex:1;min-width:0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;">${name}${qty > 1 ? ` <span style="color:#888;font-weight:400;">x${qty}</span>` : ''}</p>
      <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0;white-space:nowrap;font-family:Georgia,'Times New Roman',serif;">$${Number(price).toFixed(2)}</p>
    </div>
    ${summaryHtml ? `<p style="font-size:11px;color:#999;line-height:1.5;margin:4px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${summaryHtml}</p>` : ''}
  </div>
</div>`
}

// Table-based fallback for email clients that don't support flexbox
async function buildOrderItemTableHtml(item: any, supabase: any): Promise<string> {
  const name = item.product_name || formatJewelryType(item.jewelry_type || 'Jewelry')
  let imgUrl = item.preview_image_url
  const summary = item.customization_summary || ''
  const qty = item.quantity || 1
  const price = item.total_price || item.base_price || 0

  // Intelligent image lookup if preview is missing
  if (!imgUrl && item.jewelry_type) {
    try {
      // We need the type field (necklace, ring, etc.) for the image generator
      const { data: product } = await supabase
        .from('jewelry_items')
        .select('type, base_image_url')
        .eq('id', item.jewelry_type)
        .single()

      if (product) {
        if (item.customization_data && Object.keys(item.customization_data).length > 0) {
          const generatedUrl = await CustomizationService.generateVariantImageUrl(
            product.type,
            item.customization_data
          )
          imgUrl = generatedUrl || product.base_image_url
        } else {
          imgUrl = product.base_image_url
        }
      }
    } catch (e) {
      console.warn('Could not generate dynamic image for email item:', e)
    }
  }

  const summaryParts = summary.split('•').map((s: string) => s.trim()).filter(Boolean)
  const summaryHtml = summaryParts.length > 0
    ? summaryParts.map((part: string) => {
      const [label, ...rest] = part.split(':')
      const value = rest.join(':').trim()
      if (value) {
        return `<span style="color:#888;">${label.trim()}:</span> ${value}`
      }
      return part
    }).join(' &middot; ')
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;border-collapse:collapse;">
<tr>
  <td style="width:90px;vertical-align:top;padding:0;">
    ${imgUrl
      ? `<img src="${imgUrl}" alt="${name}" width="90" height="90" style="width:90px;height:90px;object-fit:cover;display:block;border-radius:8px 0 0 8px;" />`
      : `<div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;line-height:90px;border-radius:8px 0 0 8px;"><span style="font-size:24px;color:#ccc;">&#9670;</span></div>`
    }
  </td>
  <td style="vertical-align:top;padding:12px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;padding:0 0 4px;">${name}${qty > 1 ? ` <span style="color:#888;font-weight:400;">x${qty}</span>` : ''}</td>
      <td style="font-size:14px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;text-align:right;white-space:nowrap;padding:0 0 4px;">$${Number(price).toFixed(2)}</td>
    </tr>
    ${summaryHtml ? `<tr><td colspan="2" style="font-size:11px;color:#999;line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:0;">${summaryHtml}</td></tr>` : ''}
    </table>
  </td>
</tr>
</table>`
}

function formatJewelryType(type: string): string {
  const map: Record<string, string> = {
    necklaces: 'Custom Necklace',
    rings: 'Custom Ring',
    bracelets: 'Custom Bracelet',
    earrings: 'Custom Earrings',
  }
  const lower = type.toLowerCase()
  return map[lower] || ('Custom ' + lower.charAt(0).toUpperCase() + lower.slice(1))
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { user, supabase } = auth

    const body = await request.json()
    const { to_email, to_name, subject, bodyContent, template_id, variables, order_id } = body

    if (!to_email || !subject || !bodyContent) {
      return NextResponse.json({ error: 'to_email, subject, and bodyContent are required' }, { status: 400 })
    }

    // If order_id is provided, fetch order items and build HTML
    const enrichedVariables: Record<string, string> = { ...(variables || {}) }

    if (order_id) {
      const { data: orderItems } = await (supabase
        .from('order_items') as any)
        .select('*')
        .eq('order_id', order_id)

      if (orderItems && orderItems.length > 0) {
        const itemsHtml = (await Promise.all(orderItems
          .map((item: any) => buildOrderItemTableHtml(item, supabase))))
          .join('')
        enrichedVariables['{{order_items_html}}'] = itemsHtml
      }

      // Fetch order data if not already in variables
      const { data: order } = await (supabase
        .from('orders') as any)
        .select('*')
        .eq('id', order_id)
        .single()

      if (order) {
        if (!enrichedVariables['{{order_number}}']) enrichedVariables['{{order_number}}'] = order.order_number || order.id.slice(0, 8)
        if (!enrichedVariables['{{customer_name}}']) enrichedVariables['{{customer_name}}'] = order.customer_name || ''
        if (!enrichedVariables['{{customer_email}}']) enrichedVariables['{{customer_email}}'] = order.customer_email || ''
        if (!enrichedVariables['{{order_total}}']) enrichedVariables['{{order_total}}'] = `$${Number(order.total || order.total_amount || 0).toFixed(2)}`
        if (!enrichedVariables['{{subtotal}}']) enrichedVariables['{{subtotal}}'] = `$${Number(order.subtotal || 0).toFixed(2)}`
        if (!enrichedVariables['{{delivery_fee}}']) enrichedVariables['{{delivery_fee}}'] = order.delivery_fee ? `$${Number(order.delivery_fee).toFixed(2)}` : 'Free'
        if (!enrichedVariables['{{payment_method}}']) enrichedVariables['{{payment_method}}'] = formatPaymentMethod(order.payment_method)
        if (!enrichedVariables['{{discount_code}}']) enrichedVariables['{{discount_code}}'] = order.discount_code || ''
        if (!enrichedVariables['{{discount_amount}}']) enrichedVariables['{{discount_amount}}'] = order.discount_amount ? `$${Number(order.discount_amount).toFixed(2)}` : ''
      }
    }

    // If no order_items_html was built, provide an empty fallback
    if (!enrichedVariables['{{order_items_html}}']) {
      enrichedVariables['{{order_items_html}}'] = ''
    }

    // Resolve variables in subject and body
    const resolvedSubject = resolveVariables(subject, enrichedVariables)
    const resolvedBody = resolveVariables(bodyContent, enrichedVariables)
    const htmlContent = buildHtmlEmail(resolvedBody)

    // Send via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Maison Jové <noreply@maisonjove.com>'

    const { data: resendData, error: resendError } = await getResend().emails.send({
      from: fromEmail,
      to: [to_email],
      subject: resolvedSubject,
      html: htmlContent,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
    })

    const status = resendError ? 'failed' : 'sent'

    // Log to history
    await (supabase
      .from('email_send_history') as any)
      .insert({
        template_id: template_id || null,
        to_email,
        to_name: to_name || null,
        subject: resolvedSubject,
        body: resolvedBody,
        status,
        error_message: resendError?.message || null,
        sent_by: user.id,
        resend_id: resendData?.id || null,
      })

    if (resendError) {
      console.error('[EmailSend] Resend error:', resendError)
      return NextResponse.json({ error: resendError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: resendData?.id })
  } catch (err: any) {
    console.error('[EmailSend] error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return 'N/A'
  const map: Record<string, string> = {
    cash_on_delivery: 'Cash on Delivery',
    card: 'Credit Card',
    stripe: 'Stripe',
  }
  return map[method] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ')
}
