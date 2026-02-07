'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getImageCache } from '@/services/imageCacheService';

interface ImageLoadingState {
  [imageUrl: string]: {
    loaded: boolean;
    error: boolean;
    loading: boolean;
  };
}

interface UseImagePreloaderOptions {
  /** Minimum time to show loading state (ms) */
  minimumLoadingTime?: number;
  /** Enable caching */
  enableCache?: boolean;
  /** Priority for preloading ('high' for current images, 'low' for background) */
  priority?: 'high' | 'low';
}

export function useImagePreloader(
  imageUrls: string[],
  options: UseImagePreloaderOptions = {}
) {
  const {
    minimumLoadingTime = 1000,
    enableCache = true,
    priority = 'high'
  } = options;

  const cache = useRef(getImageCache()).current;
  const [imageStates, setImageStates] = useState<ImageLoadingState>({});
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const startTime = useRef(Date.now());

  // Check cache for already-loaded images
  const checkCache = useCallback((url: string) => {
    if (!enableCache) return null;
    return cache.get(url);
  }, [enableCache, cache]);

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      // Check if already processed in current state
      if (imageStates[url]?.loaded || imageStates[url]?.error) {
        resolve();
        return;
      }

      // Check cache first
      if (enableCache) {
        const cached = cache.get(url);
        if (cached?.loaded) {
          setImageStates(prev => ({
            ...prev,
            [url]: { loaded: true, error: false, loading: false }
          }));
          resolve();
          return;
        }
        if (cached?.error) {
          setImageStates(prev => ({
            ...prev,
            [url]: { loaded: false, error: true, loading: false }
          }));
          resolve();
          return;
        }
      }

      // Initialize loading state
      setImageStates(prev => ({
        ...prev,
        [url]: { loaded: false, error: false, loading: true }
      }));

      const img = new Image();
      
      img.onload = () => {
        // Update cache
        if (enableCache) {
          cache.setLoaded(url, img.naturalWidth * img.naturalHeight * 4);
        }
        
        setImageStates(prev => ({
          ...prev,
          [url]: { loaded: true, error: false, loading: false }
        }));
        resolve();
      };

      img.onerror = () => {
        // Update cache
        if (enableCache) {
          cache.setError(url);
        }
        
        setImageStates(prev => ({
          ...prev,
          [url]: { loaded: false, error: true, loading: false }
        }));
        resolve(); // Still resolve to continue with other images
      };

      img.src = url;
    });
  }, [imageStates, enableCache, cache]);

  // Main preloading effect
  useEffect(() => {
    if (imageUrls.length === 0) {
      setAllLoaded(true);
      return;
    }

    setTotalCount(imageUrls.length);
    startTime.current = Date.now();
    
    const preloadAll = async () => {
      if (priority === 'high') {
        // Load sequentially for high priority
        for (const url of imageUrls) {
          await preloadImage(url);
        }
      } else {
        // Load in parallel for low priority
        await Promise.all(imageUrls.map(url => preloadImage(url)));
      }
    };

    preloadAll();
  }, [imageUrls, preloadImage, priority]);

  // Update counters and allLoaded state with minimum loading time
  useEffect(() => {
    const states = Object.values(imageStates);
    const loaded = states.filter(state => state.loaded || state.error).length;
    const total = Math.max(states.length, totalCount);
    
    setLoadedCount(loaded);
    
    const imagesAllLoaded = total > 0 && loaded === total;
    
    if (imagesAllLoaded) {
      const elapsedTime = Date.now() - startTime.current;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        const timer = setTimeout(() => {
          setAllLoaded(true);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      } else {
        setAllLoaded(true);
      }
    }
  }, [imageStates, totalCount, minimumLoadingTime]);

  const getImageState = useCallback((url: string) => {
    // Check cache first for instant response
    if (enableCache) {
      const cached = cache.get(url);
      if (cached?.loaded) {
        return { loaded: true, error: false, loading: false };
      }
    }
    return imageStates[url] || { loaded: false, error: false, loading: false };
  }, [imageStates, enableCache, cache]);

  const getProgress = useCallback(() => {
    if (totalCount === 0) return 100;
    return Math.round((loadedCount / totalCount) * 100);
  }, [loadedCount, totalCount]);

  // Background preloading function
  const preloadInBackground = useCallback(async (urls: string[]) => {
    if (!enableCache) return;
    
    // Filter out already cached/loaded URLs
    const urlsToLoad = urls.filter(url => {
      const cached = cache.get(url);
      return !cached?.loaded && !cached?.error;
    });

    if (urlsToLoad.length === 0) return;

    // Load in parallel without blocking
    Promise.all(urlsToLoad.map(url => cache.preload(url)));
  }, [enableCache, cache]);

  return {
    imageStates,
    allLoaded,
    loadedCount,
    totalCount,
    progress: getProgress(),
    getImageState,
    preloadImage,
    preloadInBackground
  };
}
