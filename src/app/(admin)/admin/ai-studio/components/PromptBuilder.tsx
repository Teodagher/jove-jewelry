'use client';

import React from 'react';
import { buildPrompt, getVariantSummary } from '@/lib/ai-studio/prompts';
import { VariantConfig, ProductCategory } from '@/lib/ai-studio/types';
import { FileText, Copy, Check } from 'lucide-react';

interface PromptBuilderProps {
  category: ProductCategory;
  config: VariantConfig;
}

export default function PromptBuilder({ category, config }: PromptBuilderProps) {
  const [copied, setCopied] = React.useState(false);
  
  const prompt = buildPrompt(category, config);
  const summary = getVariantSummary(config);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          Generated Prompt
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Summary Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-full">
          {summary}
        </span>
      </div>

      {/* Prompt Preview */}
      <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
          {prompt}
        </p>
      </div>

      {/* Token estimate */}
      <p className="mt-3 text-xs text-zinc-400">
        ~{Math.ceil(prompt.length / 4)} tokens estimated
      </p>
    </div>
  );
}
