'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getImageCache } from '@/services/imageCacheService';

interface JewelryPreviewProps {
  imageUrl: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  enableZoom?: boolean;
  priority?: boolean;
}

export default function JewelryPreview({ 
  imageUrl, 
  alt, 
  width = 400, 
  height = 400, 
  className = '',
  enableZoom = true,
  priority = false
}: JewelryPreviewProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const cache = useRef(getImageCache()).current;

  // Crossfade state
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [newImageReady, setNewImageReady] = useState(false);
  const prevImageUrlRef = useRef(imageUrl);

  // Crossfade: when imageUrl changes, set up previous/new image layers
  useEffect(() => {
    const oldUrl = prevImageUrlRef.current;
    if (oldUrl && imageUrl && oldUrl !== imageUrl) {
      if (cache.isLoaded(imageUrl)) {
        setPreviousImageUrl(null);
        setNewImageReady(true);
      } else {
        setPreviousImageUrl(oldUrl);
        setNewImageReady(false);
      }
    } else if (!oldUrl && imageUrl) {
      setPreviousImageUrl(null);
      setNewImageReady(cache.isLoaded(imageUrl));
    }
    prevImageUrlRef.current = imageUrl;
  }, [imageUrl, cache]);

  // Check cache on mount and when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      setImageLoading(false);
      setImageError(false);
      setPreviousImageUrl(null);
      return;
    }

    // Check if already cached
    if (cache.isLoaded(imageUrl)) {
      setImageLoading(false);
      setImageError(false);
      setNewImageReady(true);
      return;
    }
    
    if (cache.hasError(imageUrl)) {
      setImageLoading(false);
      setImageError(true);
      return;
    }
    
    setImageLoading(true);
    setImageError(false);

    // Set timeout for slow loading images
    const timeoutDuration = retryCount > 0 ? 2000 : 3000;
    const timeout = setTimeout(() => {
      setImageLoading(false);
    }, timeoutDuration);
    
    // Quick check for cached images
    const quickCheck = setTimeout(() => {
      if (imageLoading && imageRef.current) {
        const img = imageRef.current;
        if (img.complete && img.naturalWidth > 0) {
          setImageLoading(false);
          cache.setLoaded(imageUrl);
        }
      }
    }, 200);
    
    // Additional check for network images
    const networkCheck = setTimeout(() => {
      if (imageLoading) {
        setImageLoading(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(quickCheck);
      clearTimeout(networkCheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, retryCount]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
    setRetryCount(0);
    setNewImageReady(true);

    // Update cache
    if (imageUrl) {
      cache.setLoaded(imageUrl);
    }
    // Clear previous image after fade-out completes
    setTimeout(() => {
      setPreviousImageUrl(null);
    }, 350);
  }, [imageUrl, cache]);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
    
    // Update cache
    if (imageUrl) {
      cache.setError(imageUrl);
    }
  }, [imageUrl, cache]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (enableZoom) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Check if image is cached for instant display
  const isCached = imageUrl ? cache.isLoaded(imageUrl) : false;

  return (
    <div className={`relative ${className}`}>
      {/* Main Preview Container */}
      <div 
        className={`relative bg-gray-50 rounded-lg overflow-hidden ${enableZoom ? 'cursor-zoom-in' : 'cursor-default'} mx-auto`}
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Loading skeleton - only show if not cached */}
        {imageLoading && !isCached && !imageError && imageUrl && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading image...</div>
          </div>
        )}

        {/* Image not available state */}
        {!imageUrl && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
            <div className="text-gray-500 text-lg mb-2">📷</div>
            <div className="text-gray-600 text-sm text-center">Image not available</div>
            <div className="text-gray-500 text-xs text-center mt-1">for this combination</div>
          </div>
        )}

        {/* Error state */}
        {imageError && imageUrl && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
            <div className="text-gray-600 text-sm mb-2">Image failed to load</div>
            <button 
              onClick={() => {
                setImageError(false);
                setImageLoading(true);
                setRetryCount(0);
              }}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Previous Image (crossfade: stays visible until new image loads) */}
        {!imageError && previousImageUrl && (
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8">
            <Image
              src={previousImageUrl}
              alt=""
              fill
              className={`object-contain transition-opacity duration-300 ease-in-out ${
                newImageReady ? 'opacity-0' : 'opacity-100'
              }`}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Main Image */}
        {!imageError && imageUrl && (
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className={`object-contain transition-opacity duration-300 ease-in-out ${
                (!newImageReady && previousImageUrl) ? 'opacity-0' :
                (imageLoading && !isCached) ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={priority}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </div>

      {/* Zoom Preview - Right Corner of Preview Box */}
      {enableZoom && isHovering && !imageLoading && imageUrl && (
        <div className="absolute bottom-4 right-4 w-40 h-40 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden z-50 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: '450%',
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Zoom indicator */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            4.5x Zoom
          </div>
        </div>
      )}
    </div>
  );
}
