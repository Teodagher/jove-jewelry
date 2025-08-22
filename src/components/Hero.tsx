'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import HeroCarousel from './HeroCarousel'
import { fetchHeroImages, fallbackHeroImages } from '@/services/heroImageService'

export default function Hero() {
  const [heroImages, setHeroImages] = useState<string[]>([])

  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const images = await fetchHeroImages()
        // Use Supabase images if available, otherwise use fallback images
        setHeroImages(images.length > 0 ? images : fallbackHeroImages)
      } catch (error) {
        console.error('Failed to load hero images:', error)
        setHeroImages(fallbackHeroImages)
      }
    }

    loadHeroImages()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-50">
      {/* Hero Carousel Background */}
      <HeroCarousel images={heroImages} interval={5000} />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-light mb-6 tracking-wide text-white drop-shadow-lg">
          CUSTOMIZE YOUR STORY
        </h1>
        <p className="text-xl md:text-2xl font-light mb-8 tracking-wide text-white/90 drop-shadow-md">
          Create custom bracelets, necklaces, earrings, and more.
        </p>
        <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Choose your metals, select your gemstones.
          Handcrafted to perfection and delivered to your door.
        </p>

        <div className="flex justify-center">
          <Link href="/customize">
            <Button
              size="lg"
              className="bg-zinc-900 text-white hover:bg-zinc-800 px-8 py-3 text-lg tracking-wider"
            >
              START CUSTOMIZING
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
