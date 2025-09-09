'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

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
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const imageRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!imageUrl) {
      setImageLoading(false);
      setImageError(false);
      return;
    }
    
    setImageLoading(true);
    setImageError(false);
    setLoadStartTime(Date.now());

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
        }
      }
    }, 200);
    
    // Additional check for network images
    const networkCheck = setTimeout(() => {
      if (imageLoading) {
        setImageLoading(false);
      }
    }, 1000);

    setLoadTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (quickCheck) {
        clearTimeout(quickCheck);
      }
      if (networkCheck) {
        clearTimeout(networkCheck);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, retryCount]); // imageLoading is intentionally excluded to prevent infinite re-render loop

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!imageLoading) return;
    
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    
    setImageLoading(false);
    setImageError(false);
    setRetryCount(0);
  }, [imageUrl, loadStartTime, loadTimeout, imageLoading]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    setImageLoading(false);
    setImageError(true);
  }, [imageUrl, loadStartTime, loadTimeout]);

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
        {/* Loading skeleton - only show if no image URL or if image failed */}
        {imageLoading && !imageError && !imageUrl && (
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
                setLoadStartTime(Date.now());
              }}
              className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Main Image */}
        {!imageError && imageUrl && (
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8">
            <Image
              key={imageUrl} // Force remount on URL change
              src={imageUrl}
              alt={alt}
              fill
              className={`object-contain transition-opacity duration-300 ease-in-out ${
                imageLoading ? 'opacity-30' : 'opacity-100'
              }`}
              onLoad={() => {
                handleImageLoad({} as any);
              }}
              onError={() => {
                handleImageError({} as any);
              }}
              priority={priority}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </div>

      {/* Zoom Preview - Right Corner of Preview Box */}
      {enableZoom && isHovering && !imageLoading && imageUrl && (
        <div className="absolute bottom-4 right-4 w-32 h-32 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden z-50 pointer-events-none">
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={`${alt} zoomed`}
              fill
              className="object-contain transition-transform duration-150 ease-out"
              style={{
                transform: `translate(-${mousePosition.x * 1.5 - 50}%, -${mousePosition.y * 1.5 - 50}%) scale(2)`,
                transformOrigin: 'center'
              }}
              quality={90}
              sizes="128px"
            />
          </div>
          
          {/* Zoom indicator */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            2x Zoom
          </div>
        </div>
      )}
    </div>
  );
}
