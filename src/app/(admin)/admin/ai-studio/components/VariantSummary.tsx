'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Layers, Loader2, Check, X, ImageIcon } from 'lucide-react';

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

interface VariantSummaryProps {
  productId: string | null;
  onSettingsLoad: (settings: VariantSetting[]) => void;
  enabledOptions: Record<string, Set<string>>; // settingId -> Set of enabled optionIds
  onToggleOption: (settingId: string, optionId: string) => void;
  onToggleAllSetting: (settingId: string, enabled: boolean) => void;
}

export default function VariantSummary({ 
  productId, 
  onSettingsLoad,
  enabledOptions,
  onToggleOption,
  onToggleAllSetting
}: VariantSummaryProps) {
  const [settings, setSettings] = useState<VariantSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setSettings([]);
      return;
    }

    const fetchVariants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/ai-studio/products/${productId}/variants`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch variants');
        }

        // Only include settings that affect image variants
        const imageSettings = data.settings.filter((s: VariantSetting) => s.affects_image_variant);
        setSettings(imageSettings);
        onSettingsLoad(imageSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load variants');
        setSettings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariants();
  }, [productId, onSettingsLoad]);

  // Calculate total combinations
  const totalCombinations = useMemo(() => {
    if (settings.length === 0) return 0;
    
    return settings.reduce((total, setting) => {
      const enabledCount = enabledOptions[setting.id]?.size || 0;
      return total * (enabledCount > 0 ? enabledCount : 1);
    }, 1);
  }, [settings, enabledOptions]);

  const isOptionEnabled = (settingId: string, optionId: string) => {
    return enabledOptions[settingId]?.has(optionId) ?? false;
  };

  const getEnabledCount = (settingId: string) => {
    return enabledOptions[settingId]?.size || 0;
  };

  const areAllEnabled = (setting: VariantSetting) => {
    return getEnabledCount(setting.id) === setting.options.length;
  };

  if (!productId) {
    return (
      <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-400 justify-center">
          <Layers className="w-5 h-5" />
          <span className="text-sm">Select a product to view variant options</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 text-zinc-500 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading variant options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-red-200 shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-400 justify-center">
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm">No image variants found for this product</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-zinc-900">Variant Options</h3>
          </div>
          <div className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            {totalCombinations} combinations
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Toggle options on/off to customize what variants to generate
        </p>
      </div>

      {/* Settings Grid */}
      <div className="divide-y divide-zinc-100">
        {settings.map((setting) => (
          <div key={setting.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-zinc-900">{setting.title}</h4>
                {setting.description && (
                  <p className="text-xs text-zinc-500">{setting.description}</p>
                )}
              </div>
              <button
                onClick={() => onToggleAllSetting(setting.id, !areAllEnabled(setting))}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  areAllEnabled(setting)
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {areAllEnabled(setting) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {setting.options.map((option) => {
                const enabled = isOptionEnabled(setting.id, option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => onToggleOption(setting.id, option.id)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      enabled
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {/* Color swatch or checkbox */}
                    {option.color_gradient ? (
                      <div
                        className="w-5 h-5 rounded-full border border-zinc-200"
                        style={{ background: option.color_gradient }}
                      />
                    ) : option.image_url ? (
                      <img
                        src={option.image_url}
                        alt={option.name}
                        className="w-5 h-5 object-contain rounded"
                      />
                    ) : (
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        enabled ? 'bg-amber-500 border-amber-500' : 'border-zinc-300'
                      }`}>
                        {enabled && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                    <span className="text-sm">{option.name}</span>
                    {enabled && (
                      <X className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs text-zinc-400 mt-2">
              {getEnabledCount(setting.id)} of {setting.options.length} selected
            </p>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">Total variants to generate:</span>
          <span className="font-bold text-amber-600 text-lg">{totalCombinations}</span>
        </div>
        {totalCombinations > 100 && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Large batch - this may take a while to process
          </p>
        )}
      </div>
    </div>
  );
}
