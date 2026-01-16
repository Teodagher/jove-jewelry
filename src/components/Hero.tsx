'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import HeroCarousel from './HeroCarousel'
import { fetchHeroImagesProgressive } from '@/services/heroImageService'

export default function Hero() {
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [firstImage, setFirstImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const { firstImage: first, allImages } = await fetchHeroImagesProgressive()
        
        if (first) {
          setFirstImage(first)
          setIsLoading(false)
        }
        
        const images = await allImages
        setHeroImages(images)
        
        if (!first) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to load hero images:', error)
        setHeroImages([])
        setFirstImage(null)
        setIsLoading(false)
      }
    }

    loadHeroImages()
  }, [])

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-maison-black">
      {/* Hero Carousel Background */}
      <HeroCarousel 
        images={heroImages} 
        firstImage={firstImage}
        interval={6000} 
        isInitialLoading={isLoading} 
      />
      
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-maison-black/40 via-maison-black/20 to-maison-black/60 z-[1]" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-6 md:mb-8 font-light"
        >
          Maison Jové
        </motion.p>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 md:mb-8 tracking-wide leading-tight"
        >
          Fine Jewellery,
          <br />
          <span className="italic">Crafted for Your Story</span>
        </motion.h1>

        {/* Gold accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="w-24 h-px bg-maison-gold mx-auto mb-8 md:mb-10"
        />

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-white/80 text-base md:text-lg lg:text-xl font-light tracking-wide max-w-2xl mx-auto mb-10 md:mb-14 leading-relaxed"
        >
          Choose your gold. Select your stones. Watch it transform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            href="/customize"
            className="group relative inline-flex items-center justify-center px-10 py-4 bg-white text-maison-black text-sm tracking-[0.2em] uppercase font-light overflow-hidden transition-all duration-500 hover:bg-maison-gold"
          >
            <span className="relative z-10">Start Customising</span>
          </Link>
          
          <Link
            href="/#our-work"
            className="inline-flex items-center justify-center px-10 py-4 border border-white/40 text-white text-sm tracking-[0.2em] uppercase font-light transition-all duration-500 hover:border-maison-gold hover:text-maison-gold"
          >
            View Our Work
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-maison-gold transition-colors duration-300 cursor-pointer"
        aria-label="Scroll down"
      >
        <span className="text-xs tracking-[0.2em] uppercase font-light">Discover</span>
        <ChevronDown size={20} strokeWidth={1} className="animate-scroll-hint" />
      </motion.button>

      {/* Side accent lines */}
      <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-maison-gold/40 to-transparent" />
      </div>
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-maison-gold/40 to-transparent" />
      </div>
    </section>
  )
}
