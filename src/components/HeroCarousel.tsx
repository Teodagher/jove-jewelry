'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface HeroCarouselProps {
  images: string[]
  interval?: number
}

export default function HeroCarousel({ images, interval = 4000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (images.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [images.length, interval])

  useEffect(() => {
    // Preload all images
    const preloadImages = async () => {
      const imagePromises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image()
          img.onload = resolve
          img.onerror = reject
          img.src = src
        })
      })

      try {
        await Promise.all(imagePromises)
        setIsLoading(false)
      } catch (error) {
        console.error('Error preloading images:', error)
        setIsLoading(false)
      }
    }

    if (images.length > 0) {
      preloadImages()
    }
  }, [images])

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image}
            alt={`Hero image ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ))}
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {images.map((_, index) => (
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
