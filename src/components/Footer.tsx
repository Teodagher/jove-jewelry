'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, Instagram, Mail, Phone, MapPin, Gem } from 'lucide-react'
import PoweredByAstry from './PoweredByAstry'

export default function Footer() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <footer className="bg-maison-black text-maison-ivory">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-maison-gold/40 to-transparent" />
      
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        {/* Brand section */}
        <div className="text-center mb-16 md:mb-20">
          <Link href="/" className="inline-block group">
            <h2 className="font-serif text-2xl md:text-3xl font-light tracking-[0.2em] text-maison-ivory group-hover:text-maison-gold transition-colors duration-300">
              MAISON JOVÉ
            </h2>
            <p className="text-xs text-maison-ivory/50 tracking-[0.3em] mt-2 font-light">
              FINE JEWELLERY
            </p>
          </Link>
          <div className="w-16 h-px bg-maison-gold/40 mx-auto mt-6" />
          <p className="text-maison-ivory/60 font-light text-sm md:text-base max-w-xl mx-auto mt-6 leading-relaxed">
            Built on over 35 years of family jewellery heritage, Maison Jové creates bespoke fine jewellery 
            that tells your unique story. Each piece is handcrafted with exceptional precision and care.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-16">
          {/* Collections */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-maison-gold mb-6 font-medium">
              Collections
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/customize/category/bracelets" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Bracelets
                </Link>
              </li>
              <li>
                <Link href="/customize/category/necklaces" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link href="/customize/category/rings" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Rings
                </Link>
              </li>
              <li>
                <Link href="/customize" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  All Jewellery
                </Link>
              </li>
            </ul>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-maison-gold mb-6 font-medium">
              Education
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#education" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Gold & Metals Guide
                </Link>
              </li>
              <li>
                <Link href="/#education" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Gemstone Education
                </Link>
              </li>
              <li>
                <Link href="/#education" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Craftsmanship
                </Link>
              </li>
              <li>
                <Link href="/#education" className="text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light">
                  Customisation Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-maison-gold mb-6 font-medium">
              Customer Care
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => toggleSection('shipping')}
                  className="flex items-center gap-2 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <span>Shipping Information</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${expandedSections.shipping ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.shipping && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-maison-ivory/50 mt-2 pl-0 leading-relaxed"
                  >
                    Delivery available worldwide. Standard delivery takes 5-10 business days.
                  </motion.p>
                )}
              </li>
              <li>
                <button 
                  onClick={() => toggleSection('returns')}
                  className="flex items-center gap-2 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <span>Returns & Exchanges</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${expandedSections.returns ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.returns && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-maison-ivory/50 mt-2 pl-0 leading-relaxed"
                  >
                    30-day returns on all items in original condition.
                  </motion.p>
                )}
              </li>
              <li>
                <button 
                  onClick={() => toggleSection('warranty')}
                  className="flex items-center gap-2 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <span>Lifetime Warranty</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${expandedSections.warranty ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.warranty && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-maison-ivory/50 mt-2 pl-0 leading-relaxed"
                  >
                    Full coverage for manufacturing defects.
                  </motion.p>
                )}
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-maison-gold mb-6 font-medium">
              Contact
            </h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:support@maisonjove.com" 
                  className="flex items-center gap-3 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <Mail size={14} strokeWidth={1.5} className="text-maison-gold/60" />
                  support@maisonjove.com
                </a>
              </li>
              <li>
                <a 
                  href="tel:+96171777422" 
                  className="flex items-center gap-3 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <Phone size={14} strokeWidth={1.5} className="text-maison-gold/60" />
                  +961 71 777 422
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com/maisonjove" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-maison-ivory/70 hover:text-maison-gold transition-colors duration-300 font-light"
                >
                  <Instagram size={14} strokeWidth={1.5} className="text-maison-gold/60" />
                  @maisonjove
                </a>
              </li>
            </ul>

            {/* Partner mention */}
            <div className="mt-8 pt-6 border-t border-maison-graphite/30">
              <p className="text-xs text-maison-ivory/40 font-light leading-relaxed">
                Proud partner of <span className="text-maison-ivory/60">Pierre Diamonds, Sydney</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-maison-graphite/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-xs text-maison-ivory/40 font-light tracking-wide">
              © {new Date().getFullYear()} Maison Jové. All rights reserved.
            </p>

            {/* Material badge */}
            <div className="flex items-center gap-2 text-xs text-maison-ivory/40 font-light">
              <Gem size={12} strokeWidth={1.5} className="text-maison-gold/50" />
              <span>Exclusively 18kt Gold</span>
            </div>

            {/* Powered by */}
            <PoweredByAstry />
          </div>
        </div>
      </div>
    </footer>
  )
}
