'use client'

import { motion } from 'framer-motion'
import { Gem, Sparkles, Shield } from 'lucide-react'

export default function CraftsmanshipSection() {
  return (
    <section className="relative bg-maison-black overflow-hidden">
      {/* Main content with prominent image */}
      <div className="relative">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-[80vh]">
          {/* Content section */}
          <div className="order-1 lg:order-1 flex items-center justify-center px-6 py-16 md:py-24 lg:p-16 xl:p-24">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="max-w-lg lg:max-w-xl w-full"
            >
              {/* Header */}
              <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
                The Maison Difference
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 tracking-wide leading-tight">
                Lab-Grown Diamonds
              </h2>
              <div className="w-16 h-px bg-maison-gold mb-6" />
              <p className="text-maison-gold-light text-lg md:text-xl font-light mb-8">
                Redefining Modern Luxury
              </p>
              
              <div className="space-y-6 text-white/70 leading-relaxed">
                <p className="text-base md:text-lg font-light">
                  At Maison Jové, we embrace the future of fine jewellery. Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds.
                </p>
                
                <p className="text-white font-light">
                  Same timeless elegance. Exceptional clarity. Accessible luxury.
                </p>
                
                <div className="hidden md:block space-y-4 pt-4">
                  <p className="text-sm text-white/60">
                    Created through advanced technology that mirrors natural diamond formation, our lab-grown diamonds often achieve greater clarity and brilliance, ensuring your piece shines at its absolute best.
                  </p>
                </div>
              </div>

              {/* Feature points */}
              <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-maison-graphite/50">
                <div className="text-center">
                  <Gem size={20} strokeWidth={1} className="text-maison-gold mx-auto mb-2" />
                  <p className="text-xs text-white/50 font-light">Certified Quality</p>
                </div>
                <div className="text-center">
                  <Sparkles size={20} strokeWidth={1} className="text-maison-gold mx-auto mb-2" />
                  <p className="text-xs text-white/50 font-light">Superior Clarity</p>
                </div>
                <div className="text-center">
                  <Shield size={20} strokeWidth={1} className="text-maison-gold mx-auto mb-2" />
                  <p className="text-xs text-white/50 font-light">Ethically Sourced</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="order-2 lg:order-2 relative h-[50vh] lg:min-h-full"
          >
            <div className="absolute inset-0">
              <img 
                src="/images/types-lab-grown-diamonds.jpg" 
                alt="Types of lab-grown diamonds" 
                className="w-full h-full object-cover"
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-maison-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-maison-black/60 via-transparent to-maison-black/20" />
            </div>
            
            {/* Caption overlay */}
            <div className="hidden lg:block absolute bottom-8 left-8 right-8">
              <div className="bg-maison-black/40 backdrop-blur-xl p-6 border border-white/10">
                <h3 className="font-serif text-lg font-light text-white mb-2">Exceptional Quality</h3>
                <p className="text-sm text-white/70 font-light leading-relaxed">
                  From brilliant cuts to fancy shapes, each diamond is selected for its exceptional characteristics and brilliance.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
