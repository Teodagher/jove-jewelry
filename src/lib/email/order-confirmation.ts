import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { CustomizationService } from '@/services/customizationService'

// Lazy initialize to avoid build-time errors
let resendInstance: Resend | null = null
function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

let supabaseInstance: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey)
  }
  return supabaseInstance
}

/**
 * Automatically sends order confirmation emails to both client and admin.
 * This can be safely called from webhooks or checkout completion.
 */
export async function sendOrderConfirmationEmails(orderId: string) {
    console.log(`[EmailService] Starting automated confirmation for order: ${orderId}`)

    try {
        // 1. Fetch Order and Items
        const { data: order, error: orderError } = await getSupabase()
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single() as { data: any; error: any }

        if (orderError || !order) {
            console.error('[EmailService] Order not found:', orderError)
            return { success: false, error: 'Order not found' }
        }

        // Retry fetching items to handle race conditions with webhooks/triggers
        let orderItems: any[] = []
        for (let i = 0; i < 3; i++) {
            const { data } = await getSupabase()
                .from('order_items')
                .select('*')
                .eq('order_id', orderId)

            if (data && data.length > 0) {
                orderItems = data
                break
            }
            // Wait 1s before retry
            await new Promise(r => setTimeout(r, 1000))
        }

        if (!orderItems || orderItems.length === 0) {
            console.warn('[EmailService] No items found for order after retries:', orderId)
        }

        // 2. Fetch Templates
        const { data: templates } = await getSupabase()
            .from('email_templates')
            .select('*')
            .in('name', ['Order Confirmation - Client', 'Order Confirmation - Admin']) as { data: any[] | null }

        const clientTemplate = templates?.find((t: any) => t.name === 'Order Confirmation - Client')
        const adminTemplate = templates?.find((t: any) => t.name === 'Order Confirmation - Admin')

        if (!clientTemplate || !adminTemplate) {
            console.error('[EmailService] Templates not found. Client:', !!clientTemplate, 'Admin:', !!adminTemplate)
            // We'll continue if at least one exists, but log error
        }

        // 3. Prepare Variables
        const variables: Record<string, string> = {
            '{{order_number}}': order.order_number || order.id.slice(0, 8).toUpperCase(),
            '{{customer_name}}': order.customer_name || '',
            '{{customer_email}}': order.customer_email || '',
            '{{order_total}}': `$${Number(order.total || order.total_amount || 0).toFixed(2)}`,
            '{{subtotal}}': `$${Number(order.subtotal || 0).toFixed(2)}`,
            '{{delivery_fee}}': order.delivery_fee ? `$${Number(order.delivery_fee).toFixed(2)}` : 'Free',
            '{{payment_method}}': formatPaymentMethod(order.payment_method),
            '{{discount_code}}': order.discount_code || '',
            '{{discount_amount}}': order.discount_amount ? `$${Number(order.discount_amount).toFixed(2)}` : '',
        }

        // 4. Build Item HTML (Intelligent images included)
        if (orderItems && orderItems.length > 0) {
            const itemsHtml = (await Promise.all(orderItems.map(item => buildOrderItemTableHtml(item)))).join('')
            variables['{{order_items_html}}'] = itemsHtml
        } else {
            variables['{{order_items_html}}'] = ''
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Maison Jové <support@maisonjove.com>'
        const replyTo = process.env.RESEND_REPLY_TO

        // 5. Send Client Email
        if (clientTemplate && order.customer_email) {
            // Check for duplicate send (Idempotency)
            const { data: existing } = await getSupabase()
                .from('email_send_history')
                .select('id')
                .eq('to_email', order.customer_email)
                .eq('template_id', clientTemplate.id)
                .ilike('subject', `%${order.order_number || orderId.slice(0, 8)}%`) // Rough check to ensure it's for this order
                // Better: we should add an order_id column to email_history, but for now subject match is decent proxy 
                // or just rely on time? No, let's use subject match + recent time.
                .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // sent within last hour
                .maybeSingle()

            if (existing) {
                console.log(`[EmailService] Skipping Client Email: Already sent for order ${order.order_number}`)
            } else {
                const subject = resolveVariables(clientTemplate.subject, variables)
                const body = resolveVariables(clientTemplate.content, variables)
                const html = buildHtmlEmail(body)

                const { error: clientError } = await getResend().emails.send({
                    from: fromEmail,
                    to: [order.customer_email],
                    replyTo: replyTo || undefined,
                    subject,
                    html,
                })

                if (clientError) console.error('[EmailService] Client email failed:', clientError)
                else console.log('[EmailService] Client email sent successfully')

                // Log to history
                await logEmailHistory(orderId, clientTemplate.id, order.customer_email, order.customer_name, subject, body, clientError ? 'failed' : 'sent')
            }
        }

        // 6. Send Admin Email
        if (adminTemplate) {
            const adminEmail = process.env.RESEND_REPLY_TO || 'admin@maisonjove.com'

            const { data: existingAdmin } = await getSupabase()
                .from('email_send_history')
                .select('id')
                .eq('to_email', adminEmail)
                .eq('template_id', adminTemplate.id)
                .ilike('subject', `%${order.order_number || orderId.slice(0, 8)}%`)
                .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
                .maybeSingle()

            if (existingAdmin) {
                console.log(`[EmailService] Skipping Admin Email: Already sent for order ${order.order_number}`)
            } else {
                const subject = resolveVariables(adminTemplate.subject, variables)
                const body = resolveVariables(adminTemplate.content, variables)
                const html = buildHtmlEmail(body)

                const { error: adminError } = await getResend().emails.send({
                    from: fromEmail,
                    to: [adminEmail],
                    subject,
                    html,
                })

                if (adminError) console.error('[EmailService] Admin email failed:', adminError)
                else console.log('[EmailService] Admin email sent successfully')

                // Log to history
                await logEmailHistory(orderId, adminTemplate.id, adminEmail, 'Admin', subject, body, adminError ? 'failed' : 'sent')
            }
        }

        return { success: true }

    } catch (error) {
        console.error('[EmailService] Unexpected error:', error)
        return { success: false, error }
    }
}

/**
 * HELPER FUNCTIONS
 */

function formatPaymentMethod(method: string | null): string {
    if (!method) return 'N/A'
    const map: Record<string, string> = {
        cash_on_delivery: 'Cash on Delivery',
        card: 'Credit Card',
        stripe: 'Stripe',
    }
    return map[method] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ')
}

function resolveVariables(text: string, variables: Record<string, string>): string {
    let resolved = text
    // Handle {{#if variable}}...{{/if}}
    resolved = resolved.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
        const value = variables[`{{${varName}}}`]
        return value && value.trim() ? content : ''
    })
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
        resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    return resolved
}

function buildHtmlEmail(bodyText: string): string {
    if (bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html')) {
        return bodyText
    }
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

async function buildOrderItemTableHtml(item: any): Promise<string> {
    const name = item.product_name || formatJewelryType(item.jewelry_type || 'Jewelry')
    let imgUrl = item.preview_image_url
    const summary = item.customization_summary || ''
    const qty = item.quantity || 1
    const price = item.total_price || item.base_price || 0

    if (!imgUrl && item.jewelry_type) {
        try {
            const { data: product } = await getSupabase()
                .from('jewelry_items')
                .select('type, base_image_url')
                .eq('id', item.jewelry_type)
                .single() as { data: any }

            if (product) {
                if (item.customization_data && Object.keys(item.customization_data).length > 0) {
                    const generatedUrl = await CustomizationService.generateVariantImageUrl(product.type, item.customization_data)
                    imgUrl = generatedUrl || product.base_image_url
                } else {
                    imgUrl = product.base_image_url
                }
            }
        } catch (e) {
            console.warn('Could not generate dynamic image for automatic email:', e)
        }
    }

    const summaryParts = summary.split('•').map((s: string) => s.trim()).filter(Boolean)
    const summaryHtml = summaryParts.length > 0
        ? summaryParts.map((part: string) => {
            const [label, ...rest] = part.split(':')
            const value = rest.join(':').trim()
            return value ? `<span style="color:#888;">${label.trim()}:</span> ${value}` : part
        }).join(' &middot; ')
        : ''

    return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;margin-bottom:12px;border-collapse:collapse;">
<tr>
  <td style="width:90px;vertical-align:top;padding:0;">
    ${imgUrl
            ? `<img src="${imgUrl}" alt="${name}" width="90" height="90" style="width:90px;height:90px;object-fit:cover;display:block;" />`
            : `<div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;line-height:90px;"><span style="font-size:24px;color:#ccc;">&#9670;</span></div>`
        }
  </td>
  <td style="vertical-align:top;padding:12px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:Georgia,serif;">${name}${qty > 1 ? ` <span style="color:#888;font-weight:400;">x${qty}</span>` : ''}</td>
      <td style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:Georgia,serif;text-align:right;">$${Number(price).toFixed(2)}</td>
    </tr>
    ${summaryHtml ? `<tr><td colspan="2" style="font-size:11px;color:#999;line-height:1.5;padding-top:4px;">${summaryHtml}</td></tr>` : ''}
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

async function logEmailHistory(orderId: string, templateId: string, toEmail: string, toName: string, subject: string, body: string, status: 'sent' | 'failed') {
    try {
        await (getSupabase().from('email_send_history') as any).insert({
            template_id: templateId,
            to_email: toEmail,
            to_name: toName,
            subject,
            body,
            status,
            sent_by: '00000000-0000-0000-0000-000000000000' // Dedicated UUID for system/automated emails
        })
    } catch (e) {
        console.error('[EmailService] Failed to log history:', e)
    }
}
