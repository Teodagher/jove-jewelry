'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import HeroCarousel from './HeroCarousel'
import { fetchHeroImages } from '@/services/heroImageService'

export default function Hero() {
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const images = await fetchHeroImages()
        setHeroImages(images)
      } catch (error) {
        console.error('Failed to load hero images:', error)
        setHeroImages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHeroImages()
  }, [])

  return (
    <section className="relative h-[calc(100vh-104px)] flex items-center justify-center overflow-hidden bg-stone-50">
      {/* Hero Carousel Background */}
      <HeroCarousel images={heroImages} interval={5000} isInitialLoading={isLoading} />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-light mb-4 md:mb-6 tracking-wide text-white drop-shadow-lg">
          CUSTOMIZE YOUR STORY
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-light mb-6 md:mb-8 tracking-wide text-white/90 drop-shadow-md">
          Create custom bracelets, necklaces, rings.
        </p>
        {/* Hide detailed description on mobile, show on tablet and up */}
        <p className="hidden sm:block text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Choose your metals, select your gemstones.
          Handcrafted to perfection and delivered to your door.
        </p>

        <div className="flex justify-center mt-8 sm:mt-0">
          <Link href="/customize">
            <Button
              size="lg"
              className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 sm:px-8 py-3 text-base sm:text-lg tracking-wider"
            >
              START CUSTOMIZING
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
