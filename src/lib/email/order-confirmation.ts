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
    
    // Email client compatibility notes:
    // - Outlook uses Word rendering engine and has limited CSS support
    // - Gmail strips certain CSS properties
    // - Yahoo Mail has limited support for custom styling
    // - Apple Mail generally supports modern CSS
    // 
    // Best practices applied:
    // - Table-based layout for structure
    // - Inline styles (no external CSS)
    // - Explicit dimensions on images
    // - MSO conditionals for Outlook
    // - border="0" on images to prevent blue borders in some clients
    // - mso-line-height-rule:exactly for Outlook line-height consistency
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7f5f3;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
<!--[if mso]>
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">
<tr>
<td valign="top" width="100%" style="background-color:#f7f5f3;padding:32px 16px;">
<![endif]-->
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
<!-- Header -->
<!--[if mso]>
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
<tr>
<td valign="top" width="600" style="background-color:#ffffff;padding:32px 24px;text-align:center;">
<![endif]-->
<div style="text-align:center;padding:32px 24px;background-color:#ffffff;">
<span style="font-size:28px;letter-spacing:0.2em;color:#1a1a1a;font-weight:300;mso-line-height-rule:exactly;">MAISON JOVÉ</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="40" style="width:40px;margin:16px auto 0;border-collapse:collapse;">
<tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:#c9a96e;mso-line-height-rule:exactly;">&nbsp;</td></tr>
</table>
</div>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Body -->
<!--[if mso]>
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
<tr>
<td valign="top" width="600" style="background-color:#ffffff;padding:32px 28px;">
<![endif]-->
<div style="background-color:#ffffff;padding:32px 28px;font-size:14px;line-height:1.7;color:#333333;mso-line-height-rule:exactly;">
${htmlBody}
</div>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
<!-- Footer -->
<!--[if mso]>
<table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;border-top:1px solid #e8e4de;">
<tr>
<td valign="top" width="600" style="background-color:#faf8f5;padding:20px 24px;text-align:center;">
<![endif]-->
<div style="text-align:center;padding:20px 24px;background-color:#faf8f5;border-top:1px solid #e8e4de;">
<p style="font-size:11px;color:#999;margin:0;letter-spacing:0.05em;mso-line-height-rule:exactly;">Maison Jové — Custom Jewelry</p>
</div>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
</div>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
</body>
</html>`
}

// Get the primary image for a variant from variant_images table
async function getVariantPrimaryImage(variantKey: string): Promise<string | null> {
    try {
        // First try to get the primary image
        const { data: primaryImage } = await getSupabase()
            .from('variant_images')
            .select('image_url')
            .eq('variant_key', variantKey)
            .eq('is_primary', true)
            .single() as { data: { image_url: string } | null }

        if (primaryImage?.image_url) {
            return primaryImage.image_url
        }

        // Fallback: get the first image by display_order
        const { data: firstImage } = await getSupabase()
            .from('variant_images')
            .select('image_url')
            .eq('variant_key', variantKey)
            .order('display_order', { ascending: true })
            .limit(1)
            .single() as { data: { image_url: string } | null }

        if (firstImage?.image_url) {
            return firstImage.image_url
        }

        return null
    } catch (error) {
        return null
    }
}

// Extract variant key from a customization-item URL
function extractVariantKeyFromUrl(url: string): string | null {
    // URL format: .../customization-item/{type}s/{filename}.webp
    const match = url.match(/customization-item\/[^/]+\/([^/]+)\.[a-zA-Z0-9]+$/)
    return match ? match[1] : null
}

// Verify if a URL is accessible (returns 200)
async function verifyImageUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch {
        return false
    }
}

/**
 * Convert WebP image URL to PNG for better email client compatibility
 * Outlook and some older email clients don't support WebP
 */
function convertToEmailSafeImageUrl(url: string | null): string | null {
    if (!url) return null
    
    // Replace .webp with .png for email compatibility
    // Supabase storage often has both formats available
    if (url.toLowerCase().endsWith('.webp')) {
        // Try PNG first (more compatible with email clients)
        const pngUrl = url.slice(0, -5) + '.png'
        return pngUrl
    }
    
    return url
}

/**
 * Get the best image URL for email - prefers PNG over WebP for compatibility
 */
async function getEmailSafeImageUrl(url: string | null): Promise<string | null> {
    if (!url) return null
    
    // If it's already PNG or JPG, use as-is
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.endsWith('.png') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
        // Verify it exists
        const exists = await verifyImageUrl(url)
        return exists ? url : null
    }
    
    // If WebP, try to find PNG version first
    if (lowerUrl.endsWith('.webp')) {
        const pngUrl = url.slice(0, -5) + '.png'
        const pngExists = await verifyImageUrl(pngUrl)
        if (pngExists) {
            return pngUrl
        }
        
        // Try JPG as fallback
        const jpgUrl = url.slice(0, -5) + '.jpg'
        const jpgExists = await verifyImageUrl(jpgUrl)
        if (jpgExists) {
            return jpgUrl
        }
        
        // Fall back to original WebP if no alternatives exist
        const webpExists = await verifyImageUrl(url)
        return webpExists ? url : null
    }
    
    return url
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
                    
                    if (generatedUrl) {
                        // Try to get gallery image first (higher quality/angled shots)
                        const variantKey = extractVariantKeyFromUrl(generatedUrl)
                        if (variantKey) {
                            const galleryImage = await getVariantPrimaryImage(variantKey)
                            if (galleryImage) {
                                // Convert to email-safe format (PNG preferred)
                                imgUrl = await getEmailSafeImageUrl(galleryImage)
                            } else {
                                // Verify the generated URL exists and convert to email-safe format
                                const emailSafeUrl = await getEmailSafeImageUrl(generatedUrl)
                                if (emailSafeUrl) {
                                    imgUrl = emailSafeUrl
                                } else {
                                    // Fall back to base image if variant doesn't exist
                                    console.warn(`[Email] Variant image not found: ${generatedUrl}, using base image`)
                                    imgUrl = await getEmailSafeImageUrl(product.base_image_url)
                                }
                            }
                        } else {
                            imgUrl = await getEmailSafeImageUrl(generatedUrl)
                        }
                    } else {
                        imgUrl = await getEmailSafeImageUrl(product.base_image_url)
                    }
                } else {
                    imgUrl = await getEmailSafeImageUrl(product.base_image_url)
                }
            }
        } catch (e) {
            console.warn('Could not generate dynamic image for automatic email:', e)
        }
    } else if (imgUrl) {
        // Convert existing preview image to email-safe format
        imgUrl = await getEmailSafeImageUrl(imgUrl)
    }

    const summaryParts = summary.split('•').map((s: string) => s.trim()).filter(Boolean)
    const summaryHtml = summaryParts.length > 0
        ? summaryParts.map((part: string) => {
            const [label, ...rest] = part.split(':')
            const value = rest.join(':').trim()
            return value ? `<span style="color:#888;">${label.trim()}:</span> ${value}` : part
        }).join(' &middot; ')
        : ''

    // Email client compatibility: Use table-based layout with explicit dimensions
    // Outlook needs border="0", Gmail needs inline styles, Yahoo needs alt text
    // Using conditional comments for Outlook and explicit dimensions for all clients
    const imgHtml = imgUrl
        ? `<!--[if mso]><table cellpadding="0" cellspacing="0" border="0"><tr><td style="width:90px;height:90px;"><![endif]-->
<img src="${imgUrl}" alt="${name.replace(/"/g, '&quot;')}" width="90" height="90" border="0" style="display:block;width:90px;height:90px;border:0;object-fit:cover;" />
<!--[if mso]></td></tr></table><![endif]-->`
        : `<!--[if mso]><table cellpadding="0" cellspacing="0" border="0"><tr><td style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;vertical-align:middle;"><![endif]-->
<div style="width:90px;height:90px;background-color:#f5f3f0;text-align:center;line-height:90px;mso-line-height-rule:exactly;">
<span style="font-size:24px;color:#ccc;">&#9670;</span>
</div>
<!--[if mso]></td></tr></table><![endif]-->`

    // Use table-based layout with proper Outlook conditionals
    // border-radius doesn't work in Outlook, so we use a solid border
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border:1px solid #e8e4de;margin-bottom:12px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr>
  <td width="90" style="width:90px;vertical-align:top;padding:0;font-size:0;line-height:0;mso-line-height-rule:exactly;">
    ${imgHtml}
  </td>
  <td style="vertical-align:top;padding:12px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
    <tr>
      <td style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.4;mso-line-height-rule:exactly;">${name}${qty > 1 ? ` <span style="color:#888;font-weight:400;">x${qty}</span>` : ''}</td>
      <td style="font-size:13px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;text-align:right;line-height:1.4;mso-line-height-rule:exactly;">$${Number(price).toFixed(2)}</td>
    </tr>
    ${summaryHtml ? `<tr><td colspan="2" style="font-size:11px;color:#999;line-height:1.5;padding-top:4px;font-family:Arial,sans-serif;mso-line-height-rule:exactly;">${summaryHtml}</td></tr>` : ''}
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
