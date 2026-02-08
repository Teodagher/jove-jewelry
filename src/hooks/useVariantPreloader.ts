'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getImageCache } from '@/services/imageCacheService';
import { CustomizationService } from '@/services/customizationService';

interface UseVariantPreloaderOptions {
  jewelryType: string;
  currentConfig: Record<string, string>;
  imageVariantSettings: Set<string>;
  allSettings: Array<{
    id: string;
    options: Array<{ id: string }>;
  }>;
}

/**
 * Hook for intelligent preloading of variant images
 *
 * Preloads:
 * 1. Current configuration (immediate, high priority)
 * 2. Nearby configurations (differ by one setting from current, low priority)
 */
export function useVariantPreloader({
  jewelryType,
  currentConfig,
  imageVariantSettings,
  allSettings
}: UseVariantPreloaderOptions) {
  const cache = useRef(getImageCache()).current;
  const preloadedConfigs = useRef<Set<string>>(new Set());
  const isPreloading = useRef(false);

  // Generate variant key from config
  const generateVariantKey = useCallback((config: Record<string, string>): string => {
    const parts: string[] = [];
    // Sort keys for consistent ordering
    const sortedKeys = Object.keys(config).sort();
    for (const key of sortedKeys) {
      if (config[key]) {
        parts.push(`${key}=${config[key]}`);
      }
    }
    return parts.join('|');
  }, []);

  // Get nearby configurations (differ by one setting)
  const getNearbyConfigs = useCallback((): Record<string, string>[] => {
    const nearby: Record<string, string>[] = [];
    const variantSettingIds = Array.from(imageVariantSettings);

    for (const settingId of variantSettingIds) {
      const setting = allSettings.find(s => s.id === settingId);
      if (!setting) continue;

      for (const option of setting.options) {
        if (option.id === currentConfig[settingId]) continue;

        nearby.push({
          ...currentConfig,
          [settingId]: option.id
        });
      }
    }

    return nearby;
  }, [currentConfig, imageVariantSettings, allSettings]);

  // Preload a specific configuration
  const preloadConfig = useCallback(async (
    config: Record<string, string>,
    priority: 'high' | 'low' = 'low'
  ): Promise<void> => {
    const configKey = generateVariantKey(config);

    // Skip if already preloaded
    if (preloadedConfigs.current.has(configKey)) {
      return;
    }

    try {
      // Generate the URL
      const imageUrl = await CustomizationService.generateVariantImageUrl(
        jewelryType,
        config
      );

      if (!imageUrl) return;

      // Check cache
      if (cache.isLoaded(imageUrl)) {
        preloadedConfigs.current.add(configKey);
        return;
      }

      // Preload the image
      if (priority === 'high') {
        await cache.preload(imageUrl);
      } else {
        // For low priority, don't await
        cache.preload(imageUrl);
      }

      preloadedConfigs.current.add(configKey);
    } catch {
      // Silently skip failed preloads
    }
  }, [jewelryType, generateVariantKey, cache]);

  // Main preloading effect
  useEffect(() => {
    if (isPreloading.current) return;
    if (imageVariantSettings.size === 0) return;
    if (Object.keys(currentConfig).length === 0) return;

    const runPreloading = async () => {
      isPreloading.current = true;

      try {
        // 1. Preload current config immediately (high priority)
        const currentVariantConfig: Record<string, string> = {};
        for (const settingId of imageVariantSettings) {
          const value = currentConfig[settingId];
          if (value) {
            currentVariantConfig[settingId] = value;
          }
        }

        if (Object.keys(currentVariantConfig).length > 0) {
          await preloadConfig(currentVariantConfig, 'high');
        }

        // 2. Preload nearby configs (same diamond, different metal, etc.)
        const nearby = getNearbyConfigs();
        const nearbyBatch = nearby.slice(0, 8); // Limit to 8 nearby configs

        // Load nearby configs in parallel but with lower priority
        await Promise.all(
          nearbyBatch.map(config => preloadConfig(config, 'low'))
        );
      } finally {
        isPreloading.current = false;
      }
    };

    runPreloading();
  }, [
    currentConfig,
    imageVariantSettings,
    preloadConfig,
    getNearbyConfigs,
    generateVariantKey
  ]);

  // Manual trigger for preloading specific configs
  const preloadConfigs = useCallback(async (configs: Record<string, string>[]) => {
    await Promise.all(configs.map(config => preloadConfig(config, 'low')));
  }, [preloadConfig]);

  // Get preloading stats
  const getStats = useCallback(() => {
    return {
      preloadedCount: preloadedConfigs.current.size,
      cacheStats: cache.getStats()
    };
  }, [cache]);

  return {
    preloadConfigs,
    getStats,
    getNearbyConfigs
  };
}
