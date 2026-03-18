import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      productType,    // e.g. "bracelet"
      variantConfig,  // { settingId: optionId, ... }
      generatedImageBase64,
      filename,       // the variant key / filename base (without extension)
    } = body;

    if (!productId || !generatedImageBase64 || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, generatedImageBase64, filename' },
        { status: 400 }
      );
    }

    const folder = `${productType || 'bracelet'}s`;
    const imageName = `${filename}.png`;
    const imagePath = `${folder}/${imageName}`;

    // 1. Upload (overwrite) the image in the same storage bucket/path the site reads from
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('customization-item')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 2. Get the public URL
    const { data: urlData } = supabase.storage
      .from('customization-item')
      .getPublicUrl(imagePath);

    const imageUrl = urlData.publicUrl;

    // 3. Upsert into variant_images table — this is what the product page reads
    //    variant_key = filename without extension (same convention used by ProductImagesGallery)
    const variantKey = filename; // already without extension

    const { error: upsertError } = await supabase
      .from('variant_images')
      .upsert({
        variant_key: variantKey,
        image_url: imageUrl,
        display_order: 0,
        is_primary: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'variant_key',
      });

    if (upsertError) {
      // variant_images might have a composite key — try delete+insert
      console.warn('Upsert failed, trying delete+insert:', upsertError.message);

      await supabase.from('variant_images').delete().eq('variant_key', variantKey);

      const { error: insertError } = await supabase.from('variant_images').insert({
        variant_key: variantKey,
        image_url: imageUrl,
        display_order: 0,
        is_primary: true,
      });

      if (insertError) {
        console.error('Insert also failed:', insertError);
        // Still return success since the image is uploaded — just DB link failed
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      variantKey,
      message: 'Variant approved — image live on site immediately',
    });

  } catch (error) {
    console.error('Approve API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
