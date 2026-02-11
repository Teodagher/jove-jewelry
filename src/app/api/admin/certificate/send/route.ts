import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateCertificatePDF, parseCustomizationToSpecs, type CertificateData } from '@/services/certificateService'

// Import functions from certificate route to match PDF generation
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

    // Helper to check if option is diamond (should be skipped from filename)
    const isDiamond = (optionId: string): boolean => {
      const lower = optionId.toLowerCase();
      return lower === 'diamond' || lower.endsWith('_diamond') || lower.includes('diamond');
    };

    // Only include first_stone if it's NOT diamond
    if (firstStoneOption && !isDiamond(firstStoneOption.option_id)) {
      const firstStoneSlug = mappingMap.get(firstStoneOption.option_id) || firstStoneOption.option_id;
      filenameParts.push(firstStoneSlug);
    }

    // Always include second stone if present
    if (secondStoneOption) {
      const secondStoneSlug = mappingMap.get(secondStoneOption.option_id) || secondStoneOption.option_id;
      filenameParts.push(secondStoneSlug);
    }

    // Add metal
    if (metalOption) {
      const slug = mappingMap.get(metalOption.option_id) || metalOption.option_id;
      filenameParts.push(slug);
    }

    const baseFilename = filenameParts.join('-');
    // Map jewelry type to storage folder
    const folderMap: Record<string, string> = {
      'bracelet': 'bracelets',
      'necklace': 'necklaces',
      'earrings': 'earringss', // Typo in storage folder name
      'ring': 'rings',
      'lock-bracelet': 'lock-bracelets',
      'bond-bracelet': 'bond-bracelets',
      'interlinked-bracelet': 'interlinked-bracelets',
      'the-meridian-mark': 'the-meridian-marks',
      'tennis-bracelet': 'tennis-bracelets',
    };
    const folder = folderMap[jewelryType] || `${jewelryType}s`;

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

function extractVariantKeyFromUrl(url: string): string | null {
  // URL format: .../customization-item/{type}s/{filename}.webp
  const match = url.match(/customization-item\/[^/]+\/([^/]+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

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
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Helvetica:wght@300;400;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: 'Helvetica', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #E8DFD5;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; border-bottom: 1px solid #E8DFD5;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; color: #1A1A1A; text-transform: uppercase;">
                MAISON JOVÉ
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 11px; letter-spacing: 2px; color: #C9A96E; text-transform: uppercase;">
                Fine Jewellery
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                Dear ${customerName},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                Thank you for your recent purchase from Maison Jové. We are honored to have crafted your exquisite piece and hope it brings you joy for years to come.
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                Please find attached your official <strong>Certificate of Purchase</strong> for your ${productName}. This certificate serves as documentation of your unique piece and its specifications.
              </p>
              
              <div style="background-color: #FAF8F5; border-left: 3px solid #C9A96E; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  <strong style="color: #1A1A1A;">Certificate ID:</strong> ${certificateId}
                </p>
              </div>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                Should you have any questions about your purchase or require any assistance, please don't hesitate to reach out. We are always here to help.
              </p>
              
              <p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.8; color: #1A1A1A;">
                With warm regards,
              </p>
              
              <p style="margin: 5px 0 0 0; font-size: 16px; color: #1A1A1A;">
                <strong>Joey Germani</strong><br>
                <span style="font-size: 14px; color: #666666;">Founder, Maison Jové</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAF8F5; border-top: 1px solid #E8DFD5;">
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                Maison Jové · Fine Jewellery<br>
                <a href="https://maisonjove.com.au" style="color: #C9A96E; text-decoration: none;">maisonjove.com.au</a>
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

    // Get product info - jewelry_type can be either a UUID or a type string
    let productImageUrl: string | undefined = undefined
    let productData: { type?: string; name?: string; base_image_url?: string } | null = null

    console.log('[Certificate Email] item.jewelry_type:', item.jewelry_type)
    console.log('[Certificate Email] item.preview_image_url:', item.preview_image_url)
    
    if (item.jewelry_type) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.jewelry_type)
      console.log('[Certificate Email] isUuid:', isUuid)
      
      if (isUuid) {
        const { data: product, error } = await (supabase
          .from('jewelry_items') as any)
          .select('type, name, base_image_url')
          .eq('id', item.jewelry_type)
          .single()
        console.log('[Certificate Email] UUID lookup result:', { product, error: error?.message })
        if (product) {
          productData = product
          productImageUrl = product.base_image_url || undefined
        }
      } else {
        const { data: product, error } = await (supabase
          .from('jewelry_items') as any)
          .select('type, name, base_image_url')
          .eq('type', item.jewelry_type)
          .single()
        console.log('[Certificate Email] type lookup result:', { product, error: error?.message })
        if (product) {
          productData = product
          productImageUrl = product.base_image_url || undefined
        }
      }
    }
    
    console.log('[Certificate Email] productData after lookup:', productData)

    // Fetch full product image using variant generation logic
const customizationData = item.customization_data || {}
if (productData?.type && Object.keys(customizationData).length > 0) {
  console.log('[Certificate Email] Customization Data:', JSON.stringify(customizationData, null, 2));
  console.log('[Certificate Email] Jewelry Type:', productData.type);
  
  const variantImageUrl = await generateVariantImageUrl(
    supabase,
    productData.type,
    customizationData
  )

  console.log('[Certificate Email] Generated Variant Image URL:', variantImageUrl);

  if (variantImageUrl) {
    const variantKey = extractVariantKeyFromUrl(variantImageUrl)
    
    console.log('[Certificate Email] Extracted Variant Key:', variantKey);
    
    if (variantKey) {
      const galleryImage = await getVariantPrimaryImage(supabase, variantKey)
      
      console.log('[Certificate Email] Gallery Image Result:', galleryImage);
      
      if (galleryImage) {
        productImageUrl = galleryImage
        console.log('[Certificate Email] Using gallery image:', productImageUrl);
      } else {
        productImageUrl = variantImageUrl
        console.log('[Certificate Email] Using variant image:', productImageUrl);
      }
    } else {
      productImageUrl = variantImageUrl
      console.log('[Certificate Email] No variant key, using generated URL:', productImageUrl);
    }
  } else {
    console.log('[Certificate Email] No variant image URL generated');
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
      ? await generateVariantImageUrl(supabase, productData.type, customizationData)
      : 'https://maisonjove.com.au/default-jewelry.jpg'
    )

  console.log('[Certificate Email] Fallback Image Selection:', {
    baseImageUrl: productData?.base_image_url,
    previewImageUrl: item.preview_image_url,
    finalImageUrl: productImageUrl
  })
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

    console.log('[Certificate Email] FINAL productImageUrl being passed to PDF:', productImageUrl)

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
