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
}

export default function ImageGallery({
  primaryImageUrl,
  variantKey,
  alt,
  width = 400,
  height = 400,
  className = '',
  enableZoom = true,
  priority = false
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

      // If we have gallery images, use them; otherwise fall back to primary
      if (galleryImages.length > 0) {
        setImages(galleryImages);
      } else if (primaryImageUrl) {
        setImages([primaryImageUrl]);
      } else {
        setImages([]);
      }

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

  // Touch handlers for swipe
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

  return (
    <div className={`relative ${className}`}>
      {/* Main Image Container */}
      <div
        ref={containerRef}
        className={`relative bg-gray-50 rounded-lg overflow-hidden ${
          hasMultipleImages ? 'cursor-pointer' : enableZoom ? 'cursor-zoom-in' : 'cursor-default'
        }`}
        style={{ width, height }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Loading State */}
        {(loading || imageLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="animate-pulse w-16 h-16 bg-gray-200 rounded-full" />
          </div>
        )}

        {/* Current Image */}
        {currentImageUrl && (
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8">
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Navigation Arrows (Desktop) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-800" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-800" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 z-20 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Swipe Hint (Mobile, first time) */}
        {hasMultipleImages && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full md:hidden">
            Swipe to see more
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      {hasMultipleImages && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-black w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip (for larger galleries) */}
      {images.length > 3 && (
        <div className="hidden md:flex justify-center items-center space-x-2 mt-4 overflow-x-auto pb-2">
          {images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                index === currentIndex
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={imageUrl}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Preview (Desktop) */}
      {enableZoom && isHovering && !imageLoading && currentImageUrl && !hasMultipleImages && (
        <div className="absolute bottom-4 right-4 w-40 h-40 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden z-50 pointer-events-none hidden md:block">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${currentImageUrl})`,
              backgroundSize: '450%',
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            4.5x Zoom
          </div>
        </div>
      )}
    </div>
  );
}
