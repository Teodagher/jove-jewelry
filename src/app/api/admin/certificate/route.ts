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

// Get the primary image for a variant from variant_images table
async function getVariantPrimaryImage(supabase: any, variantKey: string): Promise<string | null> {
  try {
    // First try to get the primary image
    const { data: primaryImage, error: primaryError } = await supabase
      .from('variant_images')
      .select('image_url')
      .eq('variant_key', variantKey)
      .eq('is_primary', true)
      .single();

    if (!primaryError && primaryImage?.image_url) {
      return primaryImage.image_url;
    }

    // Fallback: get the first image by display_order
    const { data: firstImage, error: firstError } = await supabase
      .from('variant_images')
      .select('image_url')
      .eq('variant_key', variantKey)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (!firstError && firstImage?.image_url) {
      return firstImage.image_url;
    }

    return null;
  } catch (error) {
    console.error('Error fetching variant primary image:', error);
    return null;
  }
}

// Extract variant key from a customization-item URL
function extractVariantKeyFromUrl(url: string): string | null {
  // URL format: .../customization-item/{type}s/{filename}.webp
  const match = url.match(/customization-item\/[^/]+\/([^/]+)\.webp$/);
  return match ? match[1] : null;
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
    const customizationData = item.customization_data || {}

    // Get product info
    let productData: { type?: string; name?: string; base_image_url?: string } | null = null
    if (item.jewelry_type) {
      const { data: product } = await (supabase
        .from('jewelry_items') as any)
        .select('type, name, base_image_url')
        .eq('id', item.jewelry_type)
        .single()
      productData = product
    }

    // Determine the best image URL for this specific variant
    let productImageUrl: string | undefined = undefined
    let debugVariantImageUrl: string | null = null
    let debugVariantKey: string | null = null
    let debugGalleryImage: string | null = null

    if (item.jewelry_type && Object.keys(customizationData).length > 0) {
      // Use CustomizationService to generate the correct variant image URL
      // This handles the file index lookup for different extensions (.png, .webp, etc.)
      const variantImageUrl = await CustomizationService.generateVariantImageUrl(
        item.jewelry_type,
        customizationData
      );
      debugVariantImageUrl = variantImageUrl
      
      if (variantImageUrl) {
        // Extract variant key from the URL to check variant_images table
        const variantKey = extractVariantKeyFromUrl(variantImageUrl);
        debugVariantKey = variantKey
        
        if (variantKey) {
          // Try to get gallery image first (higher quality/angled shots)
          const galleryImage = await getVariantPrimaryImage(supabase, variantKey);
          debugGalleryImage = galleryImage
          
          if (galleryImage) {
            productImageUrl = galleryImage;
            console.log('[Certificate] Using gallery image:', productImageUrl);
          } else {
            // Use the generated variant URL from CustomizationService
            productImageUrl = variantImageUrl;
            console.log('[Certificate] Using variant image:', productImageUrl);
          }
        } else {
          // Fallback to generated URL if we can't extract variant key
          productImageUrl = variantImageUrl;
        }
      }
    }

    // Final fallback: use product base image (NOT preview_image_url which is a user photo)
    if (!productImageUrl) {
      productImageUrl = productData?.base_image_url || undefined
      console.log('[Certificate] Using product base image:', productImageUrl)
    }

    // Build certificate data
    const certificateData: CertificateData = {
      customerName: order.customer_name || 'Valued Customer',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || undefined,
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      purchaseDate: order.created_at,
      productName: formatProductName(item.jewelry_type, productData?.name || item.product_name),
      productImageUrl,
      lineItemIndex,
      specifications: parseCustomizationToSpecs(customizationData)
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
      debug: {
        imageUrlUsed: productImageUrl,
        jewelryType: item.jewelry_type,
        customizationData,
        variantImageUrl: debugVariantImageUrl,
        variantKey: debugVariantKey,
        galleryImage: debugGalleryImage,
        baseImageUrl: productData?.base_image_url || null,
        previewImageUrl: item.preview_image_url || null,
      }
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
