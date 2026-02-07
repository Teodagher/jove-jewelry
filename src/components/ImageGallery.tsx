'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VariantImagesService } from '@/services/variantImagesService';

interface ImageGalleryProps {
  /** Primary/main image URL (from existing single-image system) */
  primaryImageUrl: string | null;
  /** Variant key for fetching gallery images (filename without extension) */
  variantKey?: string;
  /** Alt text for images */
  alt: string;
  /** Container width */
  width?: number;
  /** Container height */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Enable zoom on hover (desktop) */
  enableZoom?: boolean;
  /** Priority loading for LCP */
  priority?: boolean;
  /** Use Cartier-style layout on desktop (large image + side thumbnails) */
  desktopLayout?: 'carousel' | 'cartier';
}

export default function ImageGallery({
  primaryImageUrl,
  variantKey,
  alt,
  width = 400,
  height = 400,
  className = '',
  enableZoom = true,
  priority = false,
  desktopLayout = 'cartier'
}: ImageGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      setLoading(true);
      
      let galleryImages: string[] = [];
      
      // Try to fetch gallery images if we have a variant key
      if (variantKey) {
        try {
          galleryImages = await VariantImagesService.getVariantImagesByFilename(
            '', // productType not needed for this method
            variantKey + '.webp'
          );
        } catch (error) {
          console.error('Error fetching gallery images:', error);
        }
      }

      // Build final image array: primary image first, then gallery images
      const allImages: string[] = [];
      
      // Add primary image first (if it exists)
      if (primaryImageUrl) {
        allImages.push(primaryImageUrl);
      }
      
      // Add gallery images (deduplicate if primary is already in gallery)
      for (const img of galleryImages) {
        if (!allImages.includes(img)) {
          allImages.push(img);
        }
      }

      setImages(allImages);
      setCurrentIndex(0);
      setLoading(false);
    };

    loadGalleryImages();
  }, [primaryImageUrl, variantKey]);

  // Handle navigation
  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoading(true);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoading(true);
  }, [images.length]);

  const goToIndex = (index: number) => {
    if (index === currentIndex || index < 0 || index >= images.length) return;
    setCurrentIndex(index);
    setImageLoading(true);
  };

  // Touch handlers for swipe (mobile only)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Mouse handlers for zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const currentImageUrl = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // No image state
  if (!loading && images.length === 0) {
    return (
      <div 
        className={`relative bg-gray-100 rounded-lg flex flex-col items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-500 text-lg mb-2">📷</div>
        <div className="text-gray-600 text-sm text-center">Image not available</div>
        <div className="text-gray-500 text-xs text-center mt-1">for this combination</div>
      </div>
    );
  }

  // ===============================
  // DESKTOP CARTIER-STYLE LAYOUT
  // ===============================
  const renderDesktopCartierLayout = () => (
    <div className="hidden lg:flex gap-4">
      {/* Large Main Image */}
      <div
        ref={containerRef}
        className={`relative bg-gray-50 rounded-lg overflow-hidden flex-1 ${
          enableZoom ? 'cursor-zoom-in' : 'cursor-default'
        }`}
        style={{ width: 550, height: 550, maxWidth: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Loading State */}
        {(loading || imageLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="animate-pulse w-20 h-20 bg-gray-200 rounded-full" />
          </div>
        )}

        {/* Current Image */}
        {currentImageUrl && (
          <div className="absolute inset-0 p-8">
            <Image
              key={currentImageUrl}
              src={currentImageUrl}
              alt={`${alt}${hasMultipleImages ? ` - Image ${currentIndex + 1}` : ''}`}
              fill
              className={`object-contain transition-opacity duration-300 ${
                imageLoading ? 'opacity-30' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              priority={priority && currentIndex === 0}
              quality={90}
              sizes="550px"
            />
          </div>
        )}

        {/* Zoom Preview (Desktop) */}
        {enableZoom && isHovering && !imageLoading && currentImageUrl && (
          <div className="absolute bottom-4 left-4 w-48 h-48 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden z-50 pointer-events-none">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${currentImageUrl})`,
                backgroundSize: '500%',
                backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
              5x Zoom
            </div>
          </div>
        )}
      </div>

      {/* Vertical Thumbnail Strip (Right Side) */}
      {hasMultipleImages && (
        <div className="flex flex-col gap-3 w-20">
          {images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                index === currentIndex
                  ? 'border-black ring-1 ring-black'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={imageUrl}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ===============================
  // MOBILE LAYOUT (Edge-to-edge with thumbnails on right)
  // ===============================
  const renderMobileLayout = () => (
    <div className="lg:hidden">
      <div className="flex gap-2">
        {/* Main Image Container - Full width edge-to-edge */}
        <div
          className={`relative bg-gray-50 overflow-hidden flex-1 ${
            hasMultipleImages ? 'cursor-pointer' : 'cursor-default'
          }`}
          style={{ aspectRatio: '1/1', minHeight: 280 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Loading State */}
          {(loading || imageLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="animate-pulse w-16 h-16 bg-gray-200 rounded-full" />
            </div>
          )}

          {/* Current Image */}
          {currentImageUrl && (
            <div className="absolute inset-0 p-2">
              <Image
                key={currentImageUrl}
                src={currentImageUrl}
                alt={`${alt}${hasMultipleImages ? ` - Image ${currentIndex + 1}` : ''}`}
                fill
                className={`object-contain transition-opacity duration-300 ${
                  imageLoading ? 'opacity-30' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                priority={priority && currentIndex === 0}
                quality={85}
                sizes="(max-width: 768px) 85vw, 50vw"
              />
            </div>
          )}

          {/* Image Counter Badge */}
          {hasMultipleImages && (
            <div className="absolute top-2 left-2 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Vertical Thumbnail Strip (Right Side) - Mobile */}
        {hasMultipleImages && (
          <div className="flex flex-col gap-2 w-16 flex-shrink-0 overflow-y-auto max-h-[320px]">
            {images.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  index === currentIndex
                    ? 'border-black ring-1 ring-black'
                    : 'border-gray-200'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {desktopLayout === 'cartier' ? renderDesktopCartierLayout() : null}
      {renderMobileLayout()}
    </div>
  );
}
