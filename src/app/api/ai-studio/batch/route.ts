import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai-studio/gemini';
import { buildPrompt, getVariantFilename } from '@/lib/ai-studio/prompts';
import { BatchGenerationRequest, VariantConfig, ProductCategory } from '@/lib/ai-studio/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Store for batch job progress (in-memory for simplicity)
// In production, this should be stored in database or Redis
const batchJobs = new Map<string, {
  total: number;
  completed: number;
  failed: number;
  results: Array<{
    variantConfig: VariantConfig;
    status: 'pending' | 'completed' | 'failed';
    generatedImageBase64?: string;
    error?: string;
    promptUsed?: string;
  }>;
}>();

// Start batch generation
export async function POST(request: NextRequest) {
  try {
    const body: BatchGenerationRequest = await request.json();
    
    const { productName, category, originalImageBase64, variants } = body;
    
    if (!productName || !category || !originalImageBase64 || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create batch job
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    batchJobs.set(batchId, {
      total: variants.length,
      completed: 0,
      failed: 0,
      results: variants.map(v => ({
        variantConfig: v,
        status: 'pending',
      })),
    });
    
    // Start processing in background
    processVariants(batchId, productName, category, originalImageBase64, variants);
    
    return NextResponse.json({
      success: true,
      batchId,
      total: variants.length,
    });
    
  } catch (error) {
    console.error('Batch API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get batch status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  
  if (!batchId) {
    return NextResponse.json(
      { error: 'Missing batchId' },
      { status: 400 }
    );
  }
  
  const job = batchJobs.get(batchId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Batch job not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    batchId,
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    progress: Math.round((job.completed + job.failed) / job.total * 100),
    isComplete: job.completed + job.failed === job.total,
    results: job.results,
  });
}

// Process variants in background
async function processVariants(
  batchId: string,
  productName: string,
  category: ProductCategory,
  originalImageBase64: string,
  variants: VariantConfig[]
) {
  const job = batchJobs.get(batchId);
  if (!job) return;
  
  // Process variants sequentially to avoid rate limiting
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    
    try {
      const prompt = buildPrompt(category, variant);
      
      console.log(`[Batch ${batchId}] Processing variant ${i + 1}/${variants.length}`);
      
      const result = await generateImage(originalImageBase64, prompt);
      
      if (result.success) {
        job.results[i] = {
          variantConfig: variant,
          status: 'completed',
          generatedImageBase64: result.imageBase64,
          promptUsed: prompt,
        };
        job.completed++;
        
        // Save to database
        await saveVariantToDatabase(
          productName,
          category,
          originalImageBase64,
          result.imageBase64,
          variant,
          prompt
        );
      } else {
        job.results[i] = {
          variantConfig: variant,
          status: 'failed',
          error: result.error,
          promptUsed: prompt,
        };
        job.failed++;
      }
    } catch (error) {
      console.error(`[Batch ${batchId}] Error processing variant ${i + 1}:`, error);
      job.results[i] = {
        variantConfig: variant,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      job.failed++;
    }
    
    // Small delay between requests to avoid rate limiting
    if (i < variants.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[Batch ${batchId}] Complete: ${job.completed} successful, ${job.failed} failed`);
}

// Save variant to database
async function saveVariantToDatabase(
  productName: string,
  category: ProductCategory,
  originalImageBase64: string,
  generatedImageBase64: string,
  variantConfig: VariantConfig,
  promptUsed: string
) {
  try {
    // Create original image URL (just use a placeholder since we have base64)
    const originalImageUrl = `data:image/png;base64,${originalImageBase64.substring(0, 50)}...`;
    
    // Upload generated image
    const variantId = getVariantFilename(variantConfig);
    const fileName = `${productName}/${variantId}-${Date.now()}.png`;
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'ai-studio-variants');
    
    if (!bucketExists) {
      await supabase.storage.createBucket('ai-studio-variants', {
        public: true,
        fileSizeLimit: 10485760,
      });
    }
    
    const { error: uploadError } = await supabase.storage
      .from('ai-studio-variants')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }
    
    const { data: urlData } = supabase.storage
      .from('ai-studio-variants')
      .getPublicUrl(fileName);
    
    // Save to database
    await supabase
      .from('ai_studio_variants')
      .insert({
        product_name: productName,
        category,
        original_image_url: originalImageUrl,
        generated_image_url: urlData.publicUrl,
        variant_config: variantConfig,
        prompt_used: promptUsed,
        status: 'pending',
      });
      
  } catch (error) {
    console.error('Error saving variant to database:', error);
  }
}
