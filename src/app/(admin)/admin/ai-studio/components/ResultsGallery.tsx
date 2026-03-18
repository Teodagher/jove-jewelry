'use client';

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  RefreshCw, 
  Download, 
  Maximize2,
  Loader2,
  Eye
} from 'lucide-react';
import { VariantConfig } from '@/lib/ai-studio/types';
import { getVariantSummary } from '@/lib/ai-studio/prompts';
import ImageCompare from './ImageCompare';

export interface GeneratedVariant {
  id: string;
  originalImageBase64: string;
  generatedImageBase64: string;
  variantConfig: VariantConfig;
  promptUsed: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ResultsGalleryProps {
  variants: GeneratedVariant[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  regeneratingIds: Set<string>;
}

export default function ResultsGallery({
  variants,
  onApprove,
  onReject,
  onRegenerate,
  regeneratingIds,
}: ResultsGalleryProps) {
  const [selectedVariant, setSelectedVariant] = useState<GeneratedVariant | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid');

  const handleDownload = (variant: GeneratedVariant) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${variant.generatedImageBase64}`;
    link.download = `${getVariantSummary(variant.variantConfig).replace(/[•\s]+/g, '_')}.png`;
    link.click();
  };

  if (variants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-1">No Results Yet</h3>
        <p className="text-sm text-zinc-500">
          Generated variants will appear here for review
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-900">
          Generated Variants ({variants.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === 'compare'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={`
                bg-white rounded-xl border overflow-hidden transition-all
                ${variant.status === 'approved' ? 'border-green-300 ring-2 ring-green-100' : ''}
                ${variant.status === 'rejected' ? 'border-red-300 ring-2 ring-red-100 opacity-50' : ''}
                ${variant.status === 'pending' ? 'border-zinc-200 hover:border-zinc-300' : ''}
              `}
            >
              {/* Image */}
              <div className="relative aspect-square bg-zinc-100">
                {regeneratingIds.has(variant.id) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : (
                  <img
                    src={`data:image/png;base64,${variant.generatedImageBase64}`}
                    alt={getVariantSummary(variant.variantConfig)}
                    className="w-full h-full object-contain"
                  />
                )}
                
                {/* Status badge */}
                {variant.status !== 'pending' && (
                  <div className={`
                    absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium
                    ${variant.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    ${variant.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {variant.status === 'approved' ? 'Approved' : 'Rejected'}
                  </div>
                )}
                
                {/* Fullscreen button */}
                <button
                  onClick={() => setSelectedVariant(variant)}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <Maximize2 className="w-4 h-4 text-zinc-700" />
                </button>
              </div>

              {/* Info and actions */}
              <div className="p-3">
                <p className="text-xs font-medium text-zinc-900 truncate mb-2">
                  {getVariantSummary(variant.variantConfig)}
                </p>
                
                {/* Action buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onApprove(variant.id)}
                    disabled={variant.status === 'approved'}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1
                      ${variant.status === 'approved'
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }
                    `}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {variant.status === 'approved' ? 'Approved' : 'Approve'}
                  </button>
                  <button
                    onClick={() => onReject(variant.id)}
                    disabled={variant.status === 'rejected'}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1
                      ${variant.status === 'rejected'
                        ? 'bg-red-100 text-red-800 cursor-default'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }
                    `}
                  >
                    <X className="w-3.5 h-3.5" />
                    {variant.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </button>
                </div>
                
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => onRegenerate(variant.id)}
                    disabled={regeneratingIds.has(variant.id)}
                    className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium text-zinc-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingIds.has(variant.id) ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => handleDownload(variant)}
                    className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium text-zinc-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compare View */}
      {viewMode === 'compare' && variants.length > 0 && (
        <div className="space-y-6">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
            >
              <ImageCompare
                originalImage={`data:image/png;base64,${variant.originalImageBase64}`}
                generatedImage={`data:image/png;base64,${variant.generatedImageBase64}`}
                label={getVariantSummary(variant.variantConfig)}
              />
              
              {/* Actions */}
              <div className="p-4 border-t border-zinc-200 flex gap-2">
                <button
                  onClick={() => onApprove(variant.id)}
                  disabled={variant.status === 'approved'}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                    ${variant.status === 'approved'
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-green-500 text-white hover:bg-green-600'
                    }
                  `}
                >
                  <Check className="w-4 h-4" />
                  {variant.status === 'approved' ? 'Approved' : 'Approve'}
                </button>
                <button
                  onClick={() => onReject(variant.id)}
                  disabled={variant.status === 'rejected'}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                    ${variant.status === 'rejected'
                      ? 'bg-red-100 text-red-800 cursor-default'
                      : 'bg-red-500 text-white hover:bg-red-600'
                    }
                  `}
                >
                  <X className="w-4 h-4" />
                  {variant.status === 'rejected' ? 'Rejected' : 'Reject'}
                </button>
                <button
                  onClick={() => onRegenerate(variant.id)}
                  disabled={regeneratingIds.has(variant.id)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${regeneratingIds.has(variant.id) ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={() => handleDownload(variant)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium text-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {selectedVariant && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedVariant(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setSelectedVariant(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div
            className="max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:image/png;base64,${selectedVariant.generatedImageBase64}`}
              alt={getVariantSummary(selectedVariant.variantConfig)}
              className="max-w-full max-h-[85vh] object-contain"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium">
                {getVariantSummary(selectedVariant.variantConfig)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
