'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown, Heart } from 'lucide-react'

export default function ValentinesHero() {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/valentines-hero-bg.jpg"
          alt="Valentine's Collection"
          fill
          className="object-cover object-center md:object-[center_30%]"
          priority
          sizes="100vw"
        />
        {/* Soft overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-rose-900/20 to-orange-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Floating hearts decoration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center gap-3 mb-8"
        >
          <Heart className="w-5 h-5 text-rose-300" fill="currentColor" />
          <Heart className="w-4 h-4 text-rose-200" fill="currentColor" />
          <Heart className="w-5 h-5 text-rose-300" fill="currentColor" />
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 md:mb-8 tracking-wide leading-tight drop-shadow-lg"
        >
          Made for Two.
          <br />
          <span className="italic text-rose-300">Designed by You.</span>
        </motion.h1>

        {/* Rose gold accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto mb-8 md:mb-10"
        />

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-white/90 text-lg md:text-xl lg:text-2xl font-light tracking-wide max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed drop-shadow"
        >
          This Valentine&apos;s, create a piece that tells your story.
          <br className="hidden sm:block" />
          <span className="text-white/80">Choose your gold. Select your stones. Craft a symbol of your love.</span>
        </motion.p>

        {/* Urgency banner */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-rose-300 text-sm md:text-base font-medium tracking-wide mb-8 md:mb-10"
        >
          Order before 11 Feb to get it in time for Valentine&apos;s Day ♥
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            href="/customize"
            className="group relative inline-flex items-center justify-center px-10 py-4 bg-white text-rose-600 text-sm tracking-[0.15em] uppercase font-light overflow-hidden transition-all duration-500 hover:bg-rose-50 shadow-lg"
          >
            <Heart className="w-4 h-4 mr-2" />
            <span>Create Your Valentine&apos;s Piece</span>
          </Link>
          
          <Link
            href="/valentines"
            className="inline-flex items-center justify-center px-10 py-4 border border-white/50 text-white text-sm tracking-[0.15em] uppercase font-light transition-all duration-500 hover:border-white hover:bg-white/10"
          >
            Shop Valentine&apos;s Collection
          </Link>
        </motion.div>

        {/* Micro-copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-8 text-sm text-white/60 font-light tracking-wider"
        >
          Made to be shared. ♥ Made for two.
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-rose-300 transition-colors duration-300 cursor-pointer"
        aria-label="Scroll down"
      >
        <span className="text-xs tracking-[0.2em] uppercase font-light">Discover</span>
        <ChevronDown size={20} strokeWidth={1} className="animate-scroll-hint" />
      </motion.button>

      {/* Side decorative elements */}
      <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </div>
    </section>
  )
}
