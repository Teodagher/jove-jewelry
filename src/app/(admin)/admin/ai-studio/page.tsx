'use client';

import React, { useState, useCallback } from 'react';
import { 
  Wand2, 
  Sparkles, 
  Loader2, 
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import UploadZone from './components/UploadZone';
import ProductSelector from './components/ProductSelector';
import VariantSummary from './components/VariantSummary';
import GenerationQueue from './components/GenerationQueue';
import ResultsGallery, { GeneratedVariant } from './components/ResultsGallery';

interface Product {
  id: string;
  name: string;
  type: string;
  slug: string;
  base_image_url: string | null;
}

interface VariantOption {
  id: string;
  name: string;
  image_url: string | null;
  color_gradient: string | null;
  filename_slug: string | null;
}

interface VariantSetting {
  id: string;
  title: string;
  description: string | null;
  required: boolean;
  affects_image_variant: boolean;
  display_order: number;
  options: VariantOption[];
}

export default function AIStudioPage() {
  // Image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  
  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Variant settings from database
  const [variantSettings, setVariantSettings] = useState<VariantSetting[]>([]);
  
  // Enabled options for each setting
  const [enabledOptions, setEnabledOptions] = useState<Record<string, Set<string>>>({});
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // Handle image selection
  const handleImageSelect = useCallback((base64: string, file: File) => {
    setReferenceImage(base64);
    setReferenceFile(file);
    setError(null);
  }, []);

  // Clear image
  const handleClearImage = useCallback(() => {
    setReferenceImage(null);
    setReferenceFile(null);
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    // Reset enabled options when product changes
    setEnabledOptions({});
    setError(null);
  }, []);

  // Handle settings loaded from API
  const handleSettingsLoad = useCallback((settings: VariantSetting[]) => {
    setVariantSettings(settings);
    // Initialize all options as enabled by default
    const initialEnabled: Record<string, Set<string>> = {};
    for (const setting of settings) {
      initialEnabled[setting.id] = new Set(setting.options.map(opt => opt.id));
    }
    setEnabledOptions(initialEnabled);
  }, []);

  // Toggle individual option
  const handleToggleOption = useCallback((settingId: string, optionId: string) => {
    setEnabledOptions(prev => {
      const current = prev[settingId] || new Set();
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return { ...prev, [settingId]: next };
    });
  }, []);

  // Toggle all options for a setting
  const handleToggleAllSetting = useCallback((settingId: string, enabled: boolean) => {
    const setting = variantSettings.find(s => s.id === settingId);
    if (!setting) return;

    setEnabledOptions(prev => {
      if (enabled) {
        return { ...prev, [settingId]: new Set(setting.options.map(opt => opt.id)) };
      } else {
        return { ...prev, [settingId]: new Set() };
      }
    });
  }, [variantSettings]);

  // Calculate total combinations
  const totalCombinations = variantSettings.reduce((total, setting) => {
    const enabledCount = enabledOptions[setting.id]?.size || 0;
    return total * (enabledCount > 0 ? enabledCount : 1);
  }, variantSettings.length > 0 ? 1 : 0);

  // Generate all variants
  const handleGenerateAll = useCallback(async () => {
    if (!referenceImage) {
      setError('Please upload a reference image');
      return;
    }
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (totalCombinations === 0) {
      setError('Please select at least one option for each setting');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Build enabled settings object for API
      const enabledSettings: Record<string, { title: string; options: Array<{ id: string; name: string }> }> = {};
      
      for (const setting of variantSettings) {
        const enabledOpts = enabledOptions[setting.id];
        if (enabledOpts && enabledOpts.size > 0) {
          enabledSettings[setting.id] = {
            title: setting.title,
            options: setting.options
              .filter(opt => enabledOpts.has(opt.id))
              .map(opt => ({ id: opt.id, name: opt.name })),
          };
        }
      }

      const response = await fetch('/api/ai-studio/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSlug: selectedProduct.slug,
          originalImageBase64: referenceImage,
          enabledSettings,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Batch generation failed');
      }

      setBatchId(data.batchId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch generation failed');
      setIsGenerating(false);
    }
  }, [referenceImage, selectedProduct, variantSettings, enabledOptions, totalCombinations]);

  // Handle batch completion
  const handleBatchComplete = useCallback((results: Array<{
    combination: {
      options: Array<{ settingId: string; settingTitle: string; optionId: string; optionName: string }>;
      filename: string;
      prompt: string;
    };
    status: 'pending' | 'completed' | 'failed';
    generatedImageBase64?: string;
  }>) => {
    setIsGenerating(false);
    setBatchId(null);
    
    // Add completed results to gallery
    const newVariants: GeneratedVariant[] = results
      .filter(r => r.status === 'completed' && r.generatedImageBase64)
      .map((r, i) => {
        // Build a label from options
        const label = r.combination.options.map(opt => opt.optionName).join(' • ');
        
        // Build variant config as { settingId: optionId }
        const variantConfigMap: Record<string, string> = {};
        r.combination.options.forEach(opt => {
          variantConfigMap[opt.settingId] = opt.optionId;
        });
        
        return {
          id: `batch_${Date.now()}_${i}`,
          originalImageBase64: referenceImage?.split(',')[1] || referenceImage || '',
          generatedImageBase64: r.generatedImageBase64!,
          variantConfig: {
            // Build config object from options for compatibility
            stoneA: { type: 'diamond' as const, shape: 'round' as const },
            metal: '18k-yellow-gold' as const,
            background: 'white-seamless' as const,
            outputFormat: '1:1' as const,
          },
          variantConfigMap, // Store the actual setting->option mapping
          filename: r.combination.filename,
          promptUsed: r.combination.prompt,
          status: 'pending' as const,
          label, // Custom label with option names
        };
      });
    
    setGeneratedVariants(prev => [...newVariants, ...prev]);
  }, [referenceImage]);

  // Review actions
  const handleApprove = useCallback(async (id: string) => {
    const variant = generatedVariants.find(v => v.id === id);
    if (!variant || !selectedProduct) return;

    // Call API to save approved image to product library
    try {
      const response = await fetch('/api/ai-studio/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productType: selectedProduct.type || 'bracelet',
          variantConfig: (variant as any).variantConfigMap || {},
          generatedImageBase64: variant.generatedImageBase64,
          filename: (variant as any).filename,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedVariants(prev => 
          prev.map(v => v.id === id ? { ...v, status: 'approved' as const } : v)
        );
        // Could show a toast notification here
        console.log('Variant approved and saved:', data.imageUrl);
      } else {
        setError(`Failed to approve: ${data.error}`);
      }
    } catch (err) {
      setError(`Failed to approve: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [generatedVariants, selectedProduct]);

  const handleReject = useCallback((id: string) => {
    setGeneratedVariants(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'rejected' as const } : v)
    );
  }, []);

  const handleRegenerate = useCallback(async (id: string) => {
    // For database-driven variants, regeneration would need to re-run the specific combination
    // For now, just mark as regenerating
    setRegeneratingIds(prev => new Set(prev).add(id));
    
    // TODO: Implement single variant regeneration
    setTimeout(() => {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  }, []);

  // Check if we can generate
  const canGenerate = referenceImage && selectedProduct && totalCombinations > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-light text-zinc-900 tracking-wide">
              AI Variant Studio
            </h1>
            <p className="text-sm text-zinc-500">
              Generate all product variants with AI-powered image editing
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Setup */}
        <div className="lg:col-span-1 space-y-6">
          {/* Step 1: Upload Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">1</div>
              <span className="text-sm font-medium text-zinc-700">Upload Reference Image</span>
            </div>
            <UploadZone
              onImageSelect={handleImageSelect}
              currentImage={referenceImage}
              onClear={handleClearImage}
            />
          </div>

          {/* Step 2: Select Product */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                referenceImage ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>2</div>
              <span className="text-sm font-medium text-zinc-700">Select Product</span>
            </div>
            <ProductSelector
              selectedProductId={selectedProduct?.id || null}
              onSelect={handleProductSelect}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating || !canGenerate}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-300 disabled:to-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate {totalCombinations > 0 ? `${totalCombinations} Variants` : 'All Variants'}
              </>
            )}
          </button>

          {/* Generation Status */}
          {!canGenerate && !isGenerating && (
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {!referenceImage ? 'Upload an image to get started' :
               !selectedProduct ? 'Select a product from the dropdown' :
               'Select variant options to generate'}
            </div>
          )}
        </div>

        {/* Right column - Variant Options & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 3: Variant Options */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                selectedProduct ? 'bg-amber-500 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>3</div>
              <span className="text-sm font-medium text-zinc-700">Variant Options</span>
            </div>
            <VariantSummary
              productId={selectedProduct?.id || null}
              onSettingsLoad={handleSettingsLoad}
              enabledOptions={enabledOptions}
              onToggleOption={handleToggleOption}
              onToggleAllSetting={handleToggleAllSetting}
            />
          </div>

          {/* Generation Queue */}
          <GenerationQueue
            batchId={batchId}
            onComplete={handleBatchComplete}
          />

          {/* Results Gallery */}
          <ResultsGallery
            variants={generatedVariants}
            onApprove={handleApprove}
            onReject={handleReject}
            onRegenerate={handleRegenerate}
            regeneratingIds={regeneratingIds}
          />
        </div>
      </div>
    </div>
  );
}
