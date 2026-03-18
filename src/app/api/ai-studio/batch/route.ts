import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai-studio/gemini';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4MzY0NywiZXhwIjoyMDY5NjU5NjQ3fQ.MFR_nf0aoUKYygdnzNUCB7e8piKmHH7A_ThYxn10QfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface VariantOption {
  settingId: string;
  settingTitle: string;
  optionId: string;
  optionName: string;
}

interface VariantCombination {
  options: VariantOption[];
  filename: string;
  prompt: string;
}

interface BatchResult {
  combination: VariantCombination;
  status: 'pending' | 'completed' | 'failed';
  generatedImageBase64?: string;
  error?: string;
}

// Store for batch job progress (in-memory for simplicity)
// In production, this should be stored in database or Redis
const batchJobs = new Map<string, {
  total: number;
  completed: number;
  failed: number;
  productId: string;
  productName: string;
  results: BatchResult[];
}>();

// Generate prompt from variant options
function buildPromptFromOptions(options: VariantOption[]): string {
  const changes = options.map(opt => {
    const setting = opt.settingTitle.toLowerCase();
    if (setting.includes('stone') || setting.includes('gem')) {
      return `Change ONLY the color of the ${setting} to ${opt.optionName} (keep the exact same cut, shape, size, and facets)`;
    } else if (setting.includes('metal')) {
      return `Change ONLY the metal color to ${opt.optionName} (keep the exact same texture, finish, and reflections)`;
    } else if (setting.includes('cord') || setting.includes('leather') || setting.includes('strap')) {
      return `Change ONLY the color of the ${setting} to ${opt.optionName} (keep the exact same texture, weave, and material)`;
    }
    return `Change ONLY the color/finish of the ${setting} to ${opt.optionName}`;
  });

  return `CRITICAL: This is a COLOR-ONLY edit. You must preserve the EXACT original jewelry piece.

CHANGES TO MAKE:
${changes.join('\n')}

STRICT REQUIREMENTS - DO NOT VIOLATE:
1. DO NOT change the jewelry design, shape, structure, or proportions AT ALL
2. DO NOT change the texture, pattern, or material appearance (only the color)
3. DO NOT change the camera angle, lighting setup, or composition
4. DO NOT change the background or shadows
5. DO NOT add or remove any elements
6. DO NOT change the size or position of any component
7. KEEP the exact same bracelet/necklace weave pattern and texture
8. KEEP the exact same stone cut, facets, and sparkle pattern
9. KEEP the exact same metal finish type (polished stays polished, matte stays matte)

Think of this as a professional color correction - the ONLY thing changing is the hue/color of the specified elements. Everything else must be pixel-perfect identical to the original.`;
}

// Generate filename from options
function buildFilenameFromOptions(productSlug: string, options: VariantOption[]): string {
  const slugs = options.map(opt => opt.optionId.replace(/[^a-z0-9]/gi, '_').toLowerCase());
  return `${productSlug}_${slugs.join('_')}`;
}

// Generate cartesian product of all option combinations
function generateCombinations(
  productSlug: string,
  settings: Array<{ settingId: string; settingTitle: string; options: Array<{ optionId: string; optionName: string }> }>
): VariantCombination[] {
  if (settings.length === 0) return [];

  const result: VariantCombination[] = [];

  function combine(index: number, current: VariantOption[]): void {
    if (index === settings.length) {
      const filename = buildFilenameFromOptions(productSlug, current);
      const prompt = buildPromptFromOptions(current);
      result.push({
        options: [...current],
        filename,
        prompt,
      });
      return;
    }

    const setting = settings[index];
    for (const option of setting.options) {
      combine(index + 1, [
        ...current,
        {
          settingId: setting.settingId,
          settingTitle: setting.settingTitle,
          optionId: option.optionId,
          optionName: option.optionName,
        },
      ]);
    }
  }

  combine(0, []);
  return result;
}

// Start batch generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { productId, productName, productSlug, originalImageBase64, enabledSettings } = body;
    
    // Validate required fields
    if (!productId || !productName || !originalImageBase64 || !enabledSettings) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, productName, originalImageBase64, enabledSettings' },
        { status: 400 }
      );
    }

    // enabledSettings is: { settingId: { title: string, options: [{ id, name }] } }
    const settingsArray = Object.entries(enabledSettings).map(([settingId, data]: [string, unknown]) => {
      const settingData = data as { title: string; options: Array<{ id: string; name: string }> };
      return {
        settingId,
        settingTitle: settingData.title,
        options: settingData.options.map(opt => ({
          optionId: opt.id,
          optionName: opt.name,
        })),
      };
    });

    // Generate all combinations
    const combinations = generateCombinations(productSlug || productName, settingsArray);

    if (combinations.length === 0) {
      return NextResponse.json(
        { error: 'No variant combinations to generate' },
        { status: 400 }
      );
    }

    // Create batch job
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    batchJobs.set(batchId, {
      total: combinations.length,
      completed: 0,
      failed: 0,
      productId,
      productName,
      results: combinations.map(combo => ({
        combination: combo,
        status: 'pending' as const,
      })),
    });
    
    // Start processing in background
    processVariants(batchId, productId, productName, originalImageBase64, combinations);
    
    return NextResponse.json({
      success: true,
      batchId,
      total: combinations.length,
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
  productId: string,
  productName: string,
  originalImageBase64: string,
  combinations: VariantCombination[]
) {
  const job = batchJobs.get(batchId);
  if (!job) return;
  
  // Process variants sequentially to avoid rate limiting
  for (let i = 0; i < combinations.length; i++) {
    const combo = combinations[i];
    
    try {
      console.log(`[Batch ${batchId}] Processing variant ${i + 1}/${combinations.length}: ${combo.filename}`);
      
      const result = await generateImage(originalImageBase64, combo.prompt);
      
      if (result.success) {
        job.results[i] = {
          combination: combo,
          status: 'completed',
          generatedImageBase64: result.imageBase64,
        };
        job.completed++;
        
        // Save to database
        await saveVariantToDatabase(
          productId,
          productName,
          combo,
          originalImageBase64,
          result.imageBase64
        );
      } else {
        job.results[i] = {
          combination: combo,
          status: 'failed',
          error: result.error,
        };
        job.failed++;
      }
    } catch (error) {
      console.error(`[Batch ${batchId}] Error processing variant ${i + 1}:`, error);
      job.results[i] = {
        combination: combo,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      job.failed++;
    }
    
    // Small delay between requests to avoid rate limiting
    if (i < combinations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[Batch ${batchId}] Complete: ${job.completed} successful, ${job.failed} failed`);
}

// Save variant to database
async function saveVariantToDatabase(
  productId: string,
  productName: string,
  combination: VariantCombination,
  originalImageBase64: string,
  generatedImageBase64: string
) {
  try {
    // Upload generated image
    const fileName = `${productName}/${combination.filename}-${Date.now()}.png`;
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
    
    // Build variant config from combination options
    const variantConfig: Record<string, string> = {};
    for (const opt of combination.options) {
      variantConfig[opt.settingId] = opt.optionId;
    }

    // Save to database
    await supabase
      .from('ai_studio_variants')
      .insert({
        product_id: productId,
        product_name: productName,
        original_image_url: `data:image/png;base64,${originalImageBase64.substring(0, 50)}...`,
        generated_image_url: urlData.publicUrl,
        variant_config: variantConfig,
        variant_options: combination.options,
        prompt_used: combination.prompt,
        status: 'pending',
      });
      
  } catch (error) {
    console.error('Error saving variant to database:', error);
  }
}
