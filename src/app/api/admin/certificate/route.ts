import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateCertificatePDF, parseCustomizationToSpecs, type CertificateData } from '@/services/certificateService'

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

// Get filename mappings for a jewelry type using server-side supabase
async function getFilenameMappings(supabase: any, jewelryType: string): Promise<Map<string, string>> {
  try {
    // Get jewelry item IDs for this type
    const { data: jewelryItems } = await supabase
      .from('jewelry_items')
      .select('id')
      .eq('type', jewelryType)
      .eq('is_active', true);

    if (!jewelryItems || jewelryItems.length === 0) {
      return new Map();
    }

    const jewelryItemIds = jewelryItems.map((item: any) => item.id);

    // Fetch customization options with filename slugs
    const { data: mappings } = await supabase
      .from('customization_options')
      .select('option_id, filename_slug')
      .eq('is_active', true)
      .eq('affects_image_variant', true)
      .in('jewelry_item_id', jewelryItemIds)
      .not('filename_slug', 'is', null);

    const result = new Map<string, string>();
    for (const m of mappings || []) {
      if (m.option_id && m.filename_slug) {
        result.set(m.option_id, m.filename_slug);
      }
    }
    return result;
  } catch (error) {
    console.error('Error fetching filename mappings:', error);
    return new Map();
  }
}

// Generate variant image URL server-side
async function generateVariantImageUrl(
  supabase: any,
  jewelryType: string,
  customizations: { [key: string]: string }
): Promise<string | null> {
  const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
  
  try {
    // Get filename mappings
    const mappingMap = await getFilenameMappings(supabase, jewelryType);
    
    // Build variant options from customizations
    const variantOptions = Object.entries(customizations).map(([setting_id, option_id]) => ({
      setting_id,
      option_id
    }));

    // Extract options by setting
    const chainOption = variantOptions.find(opt => opt.setting_id === 'chain_type');
    const firstStoneOption = variantOptions.find(opt => opt.setting_id === 'first_stone');
    const secondStoneOption = variantOptions.find(opt => opt.setting_id === 'second_stone');
    const metalOption = variantOptions.find(opt => opt.setting_id === 'metal');

    // Build filename parts
    const filenameParts = [jewelryType];

    // Add chain/cord
    if (chainOption) {
      const slug = mappingMap.get(chainOption.option_id) || chainOption.option_id;
      filenameParts.push(slug);
    }

    // Dual-stone logic: when first_stone is diamond, skip it from filename
    // (matches DynamicFilenameService behavior)
    const extractStone = (id: string): string => {
      if (id && id.includes('_')) {
        const parts = id.split('_');
        if (parts.length >= 2) {
          const twoWord = parts.slice(-2).join('_');
          if (['blue_sapphire', 'pink_sapphire', 'yellow_sapphire'].includes(twoWord)) return twoWord;
        }
        const last = parts[parts.length - 1];
        if (['ruby', 'emerald', 'diamond', 'sapphire'].includes(last)) return last;
      }
      return id;
    };

    const actualFirstStone = firstStoneOption ? extractStone(firstStoneOption.option_id) : '';

    if (firstStoneOption && actualFirstStone !== 'diamond' && secondStoneOption) {
      // Both stones, first is not diamond
      filenameParts.push(mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id);
      filenameParts.push(mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id);
    } else if (secondStoneOption) {
      // First stone is diamond (skipped) or absent, include second stone only
      filenameParts.push(mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id);
    } else if (firstStoneOption) {
      // Only first stone exists, include it regardless
      filenameParts.push(mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id);
    }

    // Add metal
    if (metalOption) {
      const slug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
      filenameParts.push(slug);
    }

    const baseFilename = filenameParts.join('-');
    const folder = `${jewelryType}s`;

    // List files in the folder to find the actual filename (handles different extensions)
    const { data: files } = await supabase
      .storage
      .from('customization-item')
      .list(folder, { limit: 1000 });

    // Find matching file (case-insensitive)
    const matchingFile = files?.find((f: any) => {
      const nameWithoutExt = f.name.substring(0, f.name.lastIndexOf('.'));
      return nameWithoutExt.toLowerCase() === baseFilename.toLowerCase();
    });

    if (matchingFile) {
      return `${baseUrl}/${folder}/${matchingFile.name}`;
    }

    // Fallback: try with .webp extension
    return `${baseUrl}/${folder}/${baseFilename}.webp`;
  } catch (error) {
    console.error('Error generating variant URL:', error);
    return null;
  }
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
  const match = url.match(/customization-item\/[^/]+\/([^/]+)\.[a-zA-Z0-9]+$/);
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

    if (productData?.type && Object.keys(customizationData).length > 0) {
      // Generate variant image URL using server-side logic
      const variantImageUrl = await generateVariantImageUrl(
        supabase,
        productData.type,
        customizationData
      );
      debugVariantImageUrl = variantImageUrl
      
      console.log('[Certificate] Generated Variant Image URL:', variantImageUrl);
      console.log('[Certificate] Customization Data:', JSON.stringify(customizationData, null, 2));
      console.log('[Certificate] Jewelry Type:', productData.type);
      
      if (variantImageUrl) {
        // Extract variant key from the URL to check variant_images table
        const variantKey = extractVariantKeyFromUrl(variantImageUrl);
        debugVariantKey = variantKey
        
        console.log('[Certificate] Extracted Variant Key:', variantKey);
        
        if (variantKey) {
          // Try to get gallery image first (higher quality/angled shots)
          const galleryImage = await getVariantPrimaryImage(supabase, variantKey);
          debugGalleryImage = galleryImage
          
          console.log('[Certificate] Gallery Image Result:', galleryImage);
          
          if (galleryImage) {
            productImageUrl = galleryImage;
            console.log('[Certificate] Using gallery image:', productImageUrl);
          } else {
            // Use the generated variant URL
            productImageUrl = variantImageUrl;
            console.log('[Certificate] Using variant image:', productImageUrl);
          }
        } else {
          // Fallback to generated URL if we can't extract variant key
          productImageUrl = variantImageUrl;
          console.log('[Certificate] No variant key, using generated URL:', productImageUrl);
        }
      } else {
        console.log('[Certificate] No variant image URL generated');
      }
    }

    // Comprehensive fallback image selection
    if (!productImageUrl) {
      // Priority order:
      // 1. Base image from product data 
      // 2. Preview image from line item
      // 3. First found variant image for the item
      // 4. Static fallback image
      productImageUrl = 
        productData?.base_image_url || 
        item.preview_image_url || 
        (productData?.type 
          ? await generateVariantImageUrl(
              supabase, 
              productData.type, 
              customizationData
            )
          : 'https://maisonjove.com.au/default-jewelry.jpg'
        )

      console.log('[Certificate] Fallback Image Selection:', {
        baseImageUrl: productData?.base_image_url,
        previewImageUrl: item.preview_image_url,
        finalImageUrl: productImageUrl
      })
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
        jewelryType: productData?.type || item.jewelry_type,
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

    // Resolve customized product images for each item
    const items = await Promise.all((orderItems || []).map(async (item: any, index: number) => {
      let imageUrl: string | null = null

      // Get product info to resolve the jewelry type
      let productData: { type?: string; base_image_url?: string } | null = null
      if (item.jewelry_type) {
        const { data: product } = await (supabase
          .from('jewelry_items') as any)
          .select('type, base_image_url')
          .eq('id', item.jewelry_type)
          .single()
        productData = product
      }

      const customizationData = item.customization_data || {}

      if (productData?.type && Object.keys(customizationData).length > 0) {
        // Generate variant image URL using the same logic as POST handler
        const variantImageUrl = await generateVariantImageUrl(
          supabase,
          productData.type,
          customizationData
        )

        if (variantImageUrl) {
          // Try gallery image first (higher quality)
          const variantKey = extractVariantKeyFromUrl(variantImageUrl)
          if (variantKey) {
            const galleryImage = await getVariantPrimaryImage(supabase, variantKey)
            imageUrl = galleryImage || variantImageUrl
          } else {
            imageUrl = variantImageUrl
          }
        }
      }

      // Fallback to product base image
      if (!imageUrl) {
        imageUrl = productData?.base_image_url || item.preview_image_url || null
      }

      return {
        index,
        id: item.id,
        productName: formatProductName(item.jewelry_type, item.product_name),
        summary: item.customization_summary || '',
        imageUrl,
        price: item.total_price,
        certificateId: `MJ-${new Date(order.created_at).getFullYear()}-${(order.order_number || order.id.slice(0, 8)).toUpperCase()}-${index + 1}`
      }
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
