'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getImageCache } from '@/services/imageCacheService';
import { CustomizationService } from '@/services/customizationService';

interface VariantConfig {
  settingId: string;
  optionId: string;
}

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
 * 1. Current configuration (immediate)
 * 2. Nearby configurations (same diamond/stone, different metal)
 * 3. All valid combinations (background)
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

  // Get all valid variant combinations
  const getAllVariantCombinations = useCallback((): Record<string, string>[] => {
    const variantSettingIds = Array.from(imageVariantSettings);
    if (variantSettingIds.length === 0) return [];

    const settingsWithOptions = variantSettingIds.map(settingId => {
      const setting = allSettings.find(s => s.id === settingId);
      return {
        id: settingId,
        options: setting?.options.map(o => o.id) || []
      };
    });

    // Generate all combinations using cartesian product
    const combinations: Record<string, string>[] = [];
    
    function generateCombinations(
      index: number,
      current: Record<string, string>
    ) {
      if (index === settingsWithOptions.length) {
        combinations.push({ ...current });
        return;
      }

      const setting = settingsWithOptions[index];
      for (const optionId of setting.options) {
        current[setting.id] = optionId;
        generateCombinations(index + 1, current);
      }
    }

    generateCombinations(0, {});
    return combinations;
  }, [imageVariantSettings, allSettings]);

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
    } catch (error) {
      console.warn('Failed to preload variant:', error);
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

        // 3. Preload all other valid combinations in background
        // Use requestIdleCallback if available, otherwise setTimeout
        const scheduleBackgroundWork = (callback: () => void) => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback(callback, { timeout: 2000 });
          } else {
            setTimeout(callback, 100);
          }
        };

        scheduleBackgroundWork(async () => {
          const allCombinations = getAllVariantCombinations();
          
          // Filter out already preloaded
          const toPreload = allCombinations.filter(config => {
            const key = generateVariantKey(config);
            return !preloadedConfigs.current.has(key);
          });

          // Preload in small batches to avoid overwhelming the browser
          const batchSize = 4;
          for (let i = 0; i < toPreload.length; i += batchSize) {
            const batch = toPreload.slice(i, i + batchSize);
            await Promise.all(batch.map(config => preloadConfig(config, 'low')));
            
            // Small delay between batches
            if (i + batchSize < toPreload.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        });
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
    getAllVariantCombinations,
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
