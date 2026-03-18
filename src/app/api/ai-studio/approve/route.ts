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
      productName,
      variantConfig, // { settingId: optionId, ... }
      generatedImageBase64,
      filename 
    } = body;

    if (!productId || !variantConfig || !generatedImageBase64) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Upload the approved image to the customization-item bucket (same as real product images)
    const folderName = `${productName?.toLowerCase().replace(/\s+/g, '-') || 'product'}s`;
    const imageName = `${filename || Object.values(variantConfig).join('_')}.png`;
    const imagePath = `${folderName}/${imageName}`;
    
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    
    const { error: uploadError } = await supabase.storage
      .from('customization-item')
      .upload(imagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
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

    // 3. Update the ai_studio_variants table to mark as approved
    const { error: updateError } = await supabase
      .from('ai_studio_variants')
      .update({ 
        status: 'approved',
        generated_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .match({ 
        product_id: productId,
        variant_config: variantConfig 
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      // Not critical - image is already uploaded
    }

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      imagePath,
      message: 'Variant approved and image saved to product library'
    });

  } catch (error) {
    console.error('Approve API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
