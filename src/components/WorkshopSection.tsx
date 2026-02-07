'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

interface AboutContent {
  subtitle: string
  heading: string
  mobile_paragraph_1: string
  mobile_paragraph_2: string
  desktop_paragraph_1: string
  desktop_paragraph_2: string
  desktop_paragraph_3: string
  founder_name: string
  founder_title: string
  quote: string
  legacy_years: string
  legacy_label: string
}

const defaults: AboutContent = {
  subtitle: 'Our Story',
  heading: 'About the Founder',
  mobile_paragraph_1: 'My name is Joey Germani, and jewellery has been in my life from a young age.',
  mobile_paragraph_2: 'Growing up in a family of jewellers with 35+ years of expertise, I became a certified Diamond Grader in New York. That vision became Maison Jové — where true luxury meets accessibility.',
  desktop_paragraph_1: 'My name is Joey Germani, and jewellery has been in my life from a young age.',
  desktop_paragraph_2: 'Growing up in a family of jewellers, I learned the art of craftsmanship at my father\'s factory, where he shared over 35 years of expertise in retail and manufacturing. By 18, I was working full-time in the family business, gaining hands-on knowledge of both jewellery and fashion.',
  desktop_paragraph_3: 'At 21, I moved to New York and became a certified Diamond Grader, determined to bring my vision to life. That vision became Maison Jové — a brand where true luxury meets accessibility, offering designs I\'ve been perfecting for years.',
  founder_name: 'Joey Germani',
  founder_title: 'Founder & Diamond Expert',
  quote: 'True luxury meets accessibility — designs perfected over generations.',
  legacy_years: '35+',
  legacy_label: 'Years Family Legacy',
}

export default function WorkshopSection() {
  const [c, setC] = useState<AboutContent>(defaults)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('website_content')
      .select('content')
      .eq('section', 'about')
      .single()
      .then(({ data }: { data: { content: AboutContent } | null }) => {
        if (data?.content) {
          setC({ ...defaults, ...(data.content as AboutContent) })
        }
      })
  }, [])

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-maison-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-maison-black mb-4 tracking-wide">
                {c.heading}
              </h2>
              <div className="w-16 h-px bg-maison-gold" />
            </div>

            <div className="space-y-6 text-maison-graphite leading-relaxed">
              {/* Mobile: Show condensed version */}
              <div className="block md:hidden space-y-4">
                <p className="text-base font-light">
                  {c.mobile_paragraph_1}
                </p>
                <p className="text-sm font-light text-maison-graphite/80">
                  {c.mobile_paragraph_2}
                </p>
              </div>

              {/* Desktop: Show full story */}
              <div className="hidden md:block space-y-6">
                <p className="text-lg font-light">
                  {c.desktop_paragraph_1}
                </p>

                <p className="text-base font-light text-maison-graphite/80">
                  {c.desktop_paragraph_2}
                </p>

                <p className="text-base font-light text-maison-graphite/80">
                  {c.desktop_paragraph_3}
                </p>
              </div>
            </div>

            {/* Signature */}
            <div className="pt-4">
              <p className="font-serif text-2xl italic text-maison-charcoal">{c.founder_name}</p>
              <p className="text-xs text-maison-gold tracking-wider uppercase mt-1">{c.founder_title}</p>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative overflow-hidden">
              {/* Main Image */}
              <div className="aspect-[4/5] relative">
                <img
                  src="/images/aboutmeimage.jpeg"
                  alt={`${c.founder_name} - ${c.founder_title}`}
                  className="w-full h-full object-cover"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-maison-black/70 via-maison-black/20 to-transparent" />
              </div>

              {/* Content overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                {/* Quote */}
                <blockquote className="mb-6">
                  <p className="font-serif text-lg md:text-xl font-light text-white leading-relaxed italic">
                    <span className="text-maison-gold text-3xl font-serif">&ldquo;</span>
                    {c.quote}
                    <span className="text-maison-gold text-3xl font-serif">&rdquo;</span>
                  </p>
                </blockquote>

                {/* Legacy badge */}
                <div className="inline-flex items-center gap-3 bg-maison-black/30 backdrop-blur-sm border border-white/20 px-4 py-2">
                  <span className="text-maison-gold text-2xl font-serif font-light">{c.legacy_years}</span>
                  <span className="text-xs text-white/80 tracking-wider uppercase">{c.legacy_label}</span>
                </div>
              </div>

              {/* GIA Logo */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6">
                <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 border border-white/30">
                  <img
                    src="/images/gia-logo.png"
                    alt="GIA Certified Diamond Grader"
                    className="h-8 md:h-10 w-auto"
                  />
                  <div className="text-center mt-2">
                    <p className="text-[10px] font-medium text-white uppercase tracking-wider">GIA Certified</p>
                  </div>
                </div>
              </div>

              {/* Gold accent border */}
              <div className="absolute top-4 left-4 bottom-4 w-px bg-maison-gold/30" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
