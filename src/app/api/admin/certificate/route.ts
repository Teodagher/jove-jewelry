import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCertificatePDF, parseCustomizationToSpecs, type CertificateData } from '@/services/certificateService'
import { CustomizationService } from '@/services/customizationService'

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

// Format jewelry type to display name
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

    // Get the specific line item
    if (lineItemIndex >= orderItems.length) {
      return NextResponse.json({ error: `Line item ${lineItemIndex} not found` }, { status: 404 })
    }

    const item = orderItems[lineItemIndex]

    // Get product image URL
    let productImageUrl = item.preview_image_url

    if (!productImageUrl && item.jewelry_type) {
      // Try to get product info
      const { data: product } = await (supabase
        .from('jewelry_items') as any)
        .select('type, name, base_image_url')
        .eq('id', item.jewelry_type)
        .single()

      if (product) {
        if (item.customization_data && Object.keys(item.customization_data).length > 0) {
          // Generate variant URL
          const generatedUrl = await CustomizationService.generateVariantImageUrl(
            product.type,
            item.customization_data
          )
          productImageUrl = generatedUrl || product.base_image_url
        } else {
          productImageUrl = product.base_image_url
        }
      }
    }

    // Build certificate data
    const certificateData: CertificateData = {
      customerName: order.customer_name || 'Valued Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || undefined,
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      purchaseDate: order.created_at,
      productName: formatProductName(item.jewelry_type, item.product_name),
      productImageUrl,
      lineItemIndex,
      specifications: parseCustomizationToSpecs(item.customization_data || {})
    }

    // Generate PDF
    const result = await generateCertificatePDF(certificateData)

    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      pdfBase64: result.pdfBase64,
      filename: `${result.certificateId}.pdf`,
      orderNumber: certificateData.orderNumber,
      productName: certificateData.productName,
    })
  } catch (err: any) {
    console.error('[Certificate] generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate certificate' }, { status: 500 })
  }
}

// GET - List all items for an order that can have certificates generated
export async function GET(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Fetch order
    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select('id, order_number, customer_name, customer_email, created_at')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await (supabase
      .from('order_items') as any)
      .select('id, jewelry_type, product_name, customization_data, customization_summary, preview_image_url, total_price')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Format items for UI
    const items = (orderItems || []).map((item: any, index: number) => ({
      index,
      id: item.id,
      productName: formatProductName(item.jewelry_type, item.product_name),
      summary: item.customization_summary || '',
      imageUrl: item.preview_image_url || null,
      price: item.total_price,
      certificateId: `MJ-${new Date(order.created_at).getFullYear()}-${(order.order_number || order.id.slice(0, 8)).toUpperCase()}-${index + 1}`
    }))

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        purchaseDate: order.created_at
      },
      items
    })
  } catch (err: any) {
    console.error('[Certificate] list error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
