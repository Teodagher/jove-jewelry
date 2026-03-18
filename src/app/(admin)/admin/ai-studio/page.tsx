'use client';

import React, { useState, useCallback } from 'react';
import { 
  Wand2, 
  Sparkles, 
  Loader2, 
  Layers,
  Plus,
  Trash2
} from 'lucide-react';
import UploadZone from './components/UploadZone';
import VariantControls from './components/VariantControls';
import PromptBuilder from './components/PromptBuilder';
import GenerationQueue from './components/GenerationQueue';
import ResultsGallery, { GeneratedVariant } from './components/ResultsGallery';
import { 
  VariantConfig, 
  ProductCategory,
} from '@/lib/ai-studio/types';
import { buildPrompt } from '@/lib/ai-studio/prompts';

// Default variant configuration
const getDefaultConfig = (): VariantConfig => ({
  stoneA: { type: 'diamond', shape: 'round' },
  metal: '18k-yellow-gold',
  background: 'white-seamless',
  outputFormat: '1:1',
});

export default function AIStudioPage() {
  // Image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  
  // Product info
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('bracelet');
  
  // Variant config
  const [variantConfig, setVariantConfig] = useState<VariantConfig>(getDefaultConfig());
  
  // Batch configurations
  const [batchConfigs, setBatchConfigs] = useState<VariantConfig[]>([]);
  
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

  // Add current config to batch
  const addToBatch = useCallback(() => {
    setBatchConfigs(prev => [...prev, { ...variantConfig }]);
  }, [variantConfig]);

  // Remove from batch
  const removeFromBatch = useCallback((index: number) => {
    setBatchConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear batch
  const clearBatch = useCallback(() => {
    setBatchConfigs([]);
  }, []);

  // Generate single variant
  const handleGenerate = useCallback(async () => {
    if (!referenceImage) {
      setError('Please upload a reference image');
      return;
    }
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          originalImageBase64: referenceImage,
          variantConfig,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Add to results
      const newVariant: GeneratedVariant = {
        id: `gen_${Date.now()}`,
        originalImageBase64: referenceImage.split(',')[1] || referenceImage,
        generatedImageBase64: data.generatedImageBase64,
        variantConfig,
        promptUsed: data.promptUsed,
        status: 'pending',
      };

      setGeneratedVariants(prev => [newVariant, ...prev]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [referenceImage, productName, category, variantConfig]);

  // Generate batch
  const handleBatchGenerate = useCallback(async () => {
    if (!referenceImage) {
      setError('Please upload a reference image');
      return;
    }
    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }
    if (batchConfigs.length === 0) {
      setError('Please add variants to the batch');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-studio/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          originalImageBase64: referenceImage,
          variants: batchConfigs,
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
  }, [referenceImage, productName, category, batchConfigs]);

  // Handle batch completion
  const handleBatchComplete = useCallback((results: Array<{
    variantConfig: VariantConfig;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    generatedImageBase64?: string;
  }>) => {
    setIsGenerating(false);
    setBatchId(null);
    clearBatch();
    
    // Add completed results to gallery
    const newVariants: GeneratedVariant[] = results
      .filter(r => r.status === 'completed' && r.generatedImageBase64)
      .map((r, i) => ({
        id: `batch_${Date.now()}_${i}`,
        originalImageBase64: referenceImage?.split(',')[1] || referenceImage || '',
        generatedImageBase64: r.generatedImageBase64!,
        variantConfig: r.variantConfig,
        promptUsed: buildPrompt(category, r.variantConfig),
        status: 'pending' as const,
      }));
    
    setGeneratedVariants(prev => [...newVariants, ...prev]);
  }, [referenceImage, category, clearBatch]);

  // Review actions
  const handleApprove = useCallback(async (id: string) => {
    setGeneratedVariants(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'approved' as const } : v)
    );
    
    // Save to database
    const variant = generatedVariants.find(v => v.id === id);
    if (variant) {
      try {
        await fetch('/api/ai-studio/generate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName,
            category,
            originalImageUrl: referenceImage,
            generatedImageBase64: variant.generatedImageBase64,
            variantConfig: variant.variantConfig,
            promptUsed: variant.promptUsed,
          }),
        });
      } catch (err) {
        console.error('Failed to save variant:', err);
      }
    }
  }, [generatedVariants, productName, category, referenceImage]);

  const handleReject = useCallback((id: string) => {
    setGeneratedVariants(prev => 
      prev.map(v => v.id === id ? { ...v, status: 'rejected' as const } : v)
    );
  }, []);

  const handleRegenerate = useCallback(async (id: string) => {
    const variant = generatedVariants.find(v => v.id === id);
    if (!variant || !referenceImage) return;

    setRegeneratingIds(prev => new Set(prev).add(id));

    try {
      const response = await fetch('/api/ai-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          originalImageBase64: referenceImage,
          variantConfig: variant.variantConfig,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedVariants(prev =>
          prev.map(v =>
            v.id === id
              ? { ...v, generatedImageBase64: data.generatedImageBase64, status: 'pending' as const }
              : v
          )
        );
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [generatedVariants, referenceImage, productName, category]);

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
              Generate product variants with AI-powered image editing
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Upload and Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Product Information</h3>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Upload Zone */}
          <UploadZone
            onImageSelect={handleImageSelect}
            currentImage={referenceImage}
            onClear={handleClearImage}
          />

          {/* Variant Controls */}
          <VariantControls
            category={category}
            onCategoryChange={setCategory}
            config={variantConfig}
            onChange={setVariantConfig}
          />

          {/* Prompt Preview */}
          <PromptBuilder
            category={category}
            config={variantConfig}
          />

          {/* Generate Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !referenceImage || !productName.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-zinc-300 disabled:to-zinc-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Single Variant
                </>
              )}
            </button>

            <button
              onClick={addToBatch}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Batch Queue
            </button>
          </div>
        </div>

        {/* Right column - Batch and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batch Queue */}
          {batchConfigs.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Batch Queue ({batchConfigs.length} variants)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearBatch}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleBatchGenerate}
                    disabled={isGenerating}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate All
                  </button>
                </div>
              </div>
              <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                {batchConfigs.map((config, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-zinc-50">
                    <span className="text-sm text-zinc-700">
                      {config.stoneA.type !== 'none' && `${config.stoneA.shape} ${config.stoneA.type}`}
                      {config.stoneA.type !== 'none' && ' • '}
                      {config.metal.replace(/-/g, ' ')}
                      {config.band && ` • ${config.band.type} ${config.band.color}`}
                    </span>
                    <button
                      onClick={() => removeFromBatch(index)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
