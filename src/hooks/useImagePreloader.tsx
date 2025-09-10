'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImageLoadingState {
  [imageUrl: string]: {
    loaded: boolean;
    error: boolean;
    loading: boolean;
  };
}

export function useImagePreloader(imageUrls: string[], minimumLoadingTime: number = 1000) {
  const [imageStates, setImageStates] = useState<ImageLoadingState>({});
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [startTime] = useState(Date.now());

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      // Skip if already processed
      if (imageStates[url]) {
        resolve();
        return;
      }

      // Initialize loading state
      setImageStates(prev => ({
        ...prev,
        [url]: { loaded: false, error: false, loading: true }
      }));

      const img = new Image();
      
      img.onload = () => {
        setImageStates(prev => ({
          ...prev,
          [url]: { loaded: true, error: false, loading: false }
        }));
        resolve();
      };

      img.onerror = () => {
        setImageStates(prev => ({
          ...prev,
          [url]: { loaded: false, error: true, loading: false }
        }));
        resolve(); // Still resolve to continue with other images
      };

      img.src = url;
    });
  }, [imageStates]);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setAllLoaded(true);
      return;
    }

    setTotalCount(imageUrls.length);
    
    const preloadAll = async () => {
      const promises = imageUrls.map(url => preloadImage(url));
      await Promise.all(promises);
    };

    preloadAll();
  }, [imageUrls, preloadImage]);

  // Update counters and allLoaded state with minimum loading time
  useEffect(() => {
    const states = Object.values(imageStates);
    const loaded = states.filter(state => state.loaded || state.error).length;
    const total = Math.max(states.length, totalCount);
    
    setLoadedCount(loaded);
    
    const imagesAllLoaded = total > 0 && loaded === total;
    
    if (imagesAllLoaded) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        // Wait for the minimum loading time before setting allLoaded to true
        const timer = setTimeout(() => {
          setAllLoaded(true);
        }, remainingTime);
        
        return () => clearTimeout(timer);
      } else {
        // Minimum time already elapsed
        setAllLoaded(true);
      }
    }
  }, [imageStates, totalCount, startTime, minimumLoadingTime]);

  const getImageState = useCallback((url: string) => {
    return imageStates[url] || { loaded: false, error: false, loading: false };
  }, [imageStates]);

  const getProgress = useCallback(() => {
    if (totalCount === 0) return 100;
    return Math.round((loadedCount / totalCount) * 100);
  }, [loadedCount, totalCount]);

  return {
    imageStates,
    allLoaded,
    loadedCount,
    totalCount,
    progress: getProgress(),
    getImageState,
    preloadImage
  };
}