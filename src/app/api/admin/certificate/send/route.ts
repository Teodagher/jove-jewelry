import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateCertificatePDF, parseCustomizationToSpecs, type CertificateData } from '@/services/certificateService'

// Lazy initialize Resend
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

function formatProductName(jewelryType: string, productName?: string): string {
  if (productName) return productName
  const map: Record<string, string> = {
    necklaces: 'Custom Necklace',
    rings: 'Custom Ring',
    bracelets: 'Custom Bracelet',
    earrings: 'Custom Earrings',
  }
  const lower = jewelryType?.toLowerCase() || 'jewelry'
  return map[lower] || ('Custom ' + lower.charAt(0).toUpperCase() + lower.slice(1))
}

// Generate email HTML
function generateCertificateEmailHtml(customerName: string, productName: string, certificateId: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e8e4df;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px; border-bottom: 1px solid #e8e4df;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; color: #1a1a1a; text-transform: uppercase;">
                MAISON JOVÉ
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #8b7355; text-transform: uppercase;">
                Fine Jewellery
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #333333;">
                Dear ${customerName},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #333333;">
                Thank you for your recent purchase from Maison Jové. We are honored to have crafted your exquisite piece and hope it brings you joy for years to come.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #333333;">
                Please find attached your official <strong>Certificate of Purchase</strong> for your ${productName}. This certificate serves as documentation of your unique piece and its specifications.
              </p>
              
              <div style="background-color: #faf9f7; border-left: 3px solid #8b7355; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  <strong style="color: #333333;">Certificate ID:</strong> ${certificateId}
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #333333;">
                Should you have any questions about your purchase or require any assistance, please don't hesitate to reach out. We are always here to help.
              </p>
              
              <p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.8; color: #333333;">
                With warm regards,
              </p>
              
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #333333;">
                <strong>Joey Germani</strong><br>
                <span style="font-size: 14px; color: #666666;">Founder, Maison Jové</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #faf9f7; border-top: 1px solid #e8e4df;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                Maison Jové · Fine Jewellery<br>
                <a href="https://maisonjove.com.au" style="color: #8b7355; text-decoration: none;">maisonjove.com.au</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    const body = await request.json()
    const { orderId, lineItemIndex = 0 } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Fetch order
    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await (supabase
      .from('order_items') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'No items found for this order' }, { status: 404 })
    }

    if (lineItemIndex >= orderItems.length) {
      return NextResponse.json({ error: `Line item ${lineItemIndex} not found` }, { status: 404 })
    }

    const item = orderItems[lineItemIndex]

    // Get product info
    let productImageUrl: string | undefined = undefined
    let productData: { type?: string; name?: string; base_image_url?: string } | null = null

    if (item.jewelry_type) {
      const { data: product } = await (supabase
        .from('jewelry_items') as any)
        .select('type, name, base_image_url')
        .eq('id', item.jewelry_type)
        .single()

      if (product) {
        productData = product
        productImageUrl = product.base_image_url || undefined
      }
    }

    if (!productImageUrl) {
      productImageUrl = item.preview_image_url || undefined
    }

    const productName = formatProductName(item.jewelry_type, productData?.name || item.product_name)
    const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase()

    // Build certificate data
    const certificateData: CertificateData = {
      customerName: order.customer_name || 'Valued Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || undefined,
      orderNumber,
      purchaseDate: order.created_at,
      productName,
      productImageUrl,
      lineItemIndex,
      specifications: parseCustomizationToSpecs(item.customization_data || {})
    }

    // Generate PDF
    const result = await generateCertificatePDF(certificateData)

    // Convert base64 to buffer for attachment
    const pdfBuffer = Buffer.from(result.pdfBase64, 'base64')

    // Send email with Resend
    const resend = getResend()
    const emailHtml = generateCertificateEmailHtml(
      certificateData.customerName,
      productName,
      result.certificateId
    )

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Maison Jové <support@maisonjove.com>'
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [order.customer_email],
      subject: `Your Certificate of Purchase - ${productName}`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      attachments: [
        {
          filename: `${result.certificateId}.pdf`,
          content: pdfBuffer,
        }
      ]
    })

    if (emailError) {
      console.error('[Certificate Email] send error:', emailError)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: emailError.message 
      }, { status: 500 })
    }

    // Log to email history
    try {
      await (supabase.from('email_send_history') as any).insert({
        template_id: null,
        to_email: order.customer_email,
        to_name: order.customer_name,
        subject: `Your Certificate of Purchase - ${productName}`,
        body: `Certificate ${result.certificateId} sent with PDF attachment`,
        status: 'sent',
        sent_by: auth.user.id
      })
    } catch (e) {
      console.warn('[Certificate Email] Failed to log history:', e)
    }

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      certificateId: result.certificateId,
      sentTo: order.customer_email,
    })
  } catch (err: any) {
    console.error('[Certificate Email] error:', err)
    return NextResponse.json({ error: err.message || 'Failed to send certificate email' }, { status: 500 })
  }
}
