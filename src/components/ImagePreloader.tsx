'use client';

import { useEffect } from 'react';

interface ImagePreloaderProps {
  urls: string[];
}

export default function ImagePreloader({ urls }: ImagePreloaderProps) {
  useEffect(() => {
    if (urls.length === 0) return;

    const preloadImages = urls.map(url => {
      const img = new Image();
      img.src = url;
      img.loading = 'lazy';
      console.log('📦 Preloading image:', url);
      
      img.onload = () => {
        console.log('✅ Preloaded:', url);
      };
      
      img.onerror = () => {
        console.warn('❌ Failed to preload:', url);
      };
      
      return img;
    });

    return () => {
      preloadImages.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urls]);

  return null; // This component doesn't render anything
}

