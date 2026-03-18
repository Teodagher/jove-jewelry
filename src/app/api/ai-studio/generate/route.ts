import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai-studio/gemini';
import { buildPrompt } from '@/lib/ai-studio/prompts';
import { GenerationRequest } from '@/lib/ai-studio/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    
    const { productName, category, originalImageBase64, variantConfig } = body;
    
    // Validate required fields
    if (!productName || !category || !originalImageBase64 || !variantConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Build the prompt
    const prompt = buildPrompt(category, variantConfig);
    
    console.log('Generating with prompt:', prompt);
    
    // Generate the image
    const result = await generateImage(originalImageBase64, prompt);
    
    if (!result.success) {
      console.error('Generation failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    // Return the generated image
    return NextResponse.json({
      success: true,
      generatedImageBase64: result.imageBase64,
      mimeType: result.mimeType,
      promptUsed: prompt,
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Save variant to database
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      productName,
      category,
      originalImageUrl,
      generatedImageBase64,
      variantConfig,
      promptUsed,
    } = body;
    
    // Upload generated image to Supabase Storage
    const fileName = `${productName}/${Date.now()}-variant.png`;
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'ai-studio-variants');
    
    if (!bucketExists) {
      await supabase.storage.createBucket('ai-studio-variants', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ai-studio-variants')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ai-studio-variants')
      .getPublicUrl(fileName);
    
    const generatedImageUrl = urlData.publicUrl;
    
    // Save to database
    const { data, error } = await supabase
      .from('ai_studio_variants')
      .insert({
        product_name: productName,
        category,
        original_image_url: originalImageUrl,
        generated_image_url: generatedImageUrl,
        variant_config: variantConfig,
        prompt_used: promptUsed,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      variant: data,
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update variant status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('ai_studio_variants')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update variant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      variant: data,
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get variants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productName = searchParams.get('productName');
    const status = searchParams.get('status');
    
    let query = supabase
      .from('ai_studio_variants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (productName) {
      query = query.eq('product_name', productName);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch variants' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      variants: data,
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
