'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface HeroCarouselProps {
  images: string[]
  firstImage?: string | null
  interval?: number
  isInitialLoading?: boolean
}

export default function HeroCarousel({ 
  images, 
  firstImage = null, 
  interval = 4000, 
  isInitialLoading = false 
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [displayImages, setDisplayImages] = useState<string[]>([])

  // Initialize with first image if available
  useEffect(() => {
    if (firstImage && displayImages.length === 0) {
      setDisplayImages([firstImage])
      setLoadedImages(new Set([0]))
    }
  }, [firstImage, displayImages.length])

  // Update display images when full image list is available
  useEffect(() => {
    if (images.length > 0 && images !== displayImages) {
      setDisplayImages(images)
      // Mark first image as loaded if it matches firstImage
      if (firstImage && images[0] === firstImage) {
        setLoadedImages(prev => new Set([...prev, 0]))
      }
    }
  }, [images, firstImage, displayImages])

  // Carousel timer effect
  useEffect(() => {
    if (displayImages.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % displayImages.length)
    }, interval)

    return () => clearInterval(timer)
  }, [displayImages.length, interval])

  // Progressive image loading effect
  useEffect(() => {
    if (displayImages.length === 0) return

    const preloadNextImages = async () => {
      for (let i = 0; i < displayImages.length; i++) {
        if (loadedImages.has(i)) continue

        try {
          await new Promise((resolve, reject) => {
            const img = new window.Image()
            img.onload = () => {
              setLoadedImages(prev => new Set([...prev, i]))
              resolve(img)
            }
            img.onerror = reject
            img.src = displayImages[i]
          })
          
          // Add small delay between loading images to prevent overwhelming
          if (i < displayImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error(`Error loading image ${i}:`, error)
          // Mark as loaded anyway to prevent infinite retry
          setLoadedImages(prev => new Set([...prev, i]))
        }
      }
    }

    preloadNextImages()
  }, [displayImages, loadedImages])

  // Show loading state only if no images available and still loading
  if (isInitialLoading && displayImages.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-stone-300 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show upload message if no images after loading is complete
  if (!isInitialLoading && displayImages.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-stone-400">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-light">Upload hero images in admin panel</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {displayImages.map((image, index) => {
        const isImageLoaded = loadedImages.has(index)
        const isCurrentImage = index === currentIndex
        
        return (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isImageLoaded ? (
              <Image
                src={image}
                alt={`Hero image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            ) : (
              // Show gradient placeholder while image loads
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
            )}
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )
      })}

      {/* Dots indicator */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {displayImages.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white shadow-lg'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
