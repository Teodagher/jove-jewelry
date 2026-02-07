'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function OurStorySection() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-maison-ivory">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Our Story
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-maison-black tracking-wide">
            A Dream Built on Friendship
          </h2>
          <div className="w-16 h-px bg-maison-gold mx-auto mt-6" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative overflow-hidden max-w-md mx-auto">
              <div className="aspect-[4/5] relative">
                <Image
                  src="/images/team.jpg"
                  alt="The Maison Jové Team - Joey Germani, Charbel Fayad, and Teo Dagher"
                  fill
                  className="object-cover"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-maison-black/60 via-transparent to-transparent" />
              </div>

              {/* Caption overlay with names */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex justify-between items-end">
                  {/* Left side - Co-founders */}
                  <div>
                    <p className="text-white text-sm font-light tracking-wide">
                      Joey Germani & Charbel Fayad
                    </p>
                    <p className="text-white/70 text-xs tracking-wider uppercase mt-1">
                      Co-Founders
                    </p>
                  </div>
                  {/* Right side - Teo */}
                  <div className="text-right">
                    <p className="text-white text-sm font-light tracking-wide">
                      Teo Dagher
                    </p>
                    <p className="text-white/70 text-xs tracking-wider uppercase mt-1">
                      Web Developer
                    </p>
                  </div>
                </div>
              </div>

              {/* Gold accent border */}
              <div className="absolute top-4 right-4 bottom-4 w-px bg-maison-gold/30" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 order-1 lg:order-2"
          >
            <p className="text-lg md:text-xl font-light text-maison-charcoal leading-relaxed">
              Maison Jové was born from a shared vision, a lifelong friendship, and a deep respect for craftsmanship.
            </p>

            <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
              From the moment they met as children, Joey Germani and his childhood best friend Charbel Fayad spoke about one day building something meaningful together. For Charbel, the dream was always clear: to create a business alongside Joey — something honest, lasting, and driven by values rather than trends.
            </p>

            <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
              For Joey, jewellery was never just a career choice. It was a calling. Raised in a family of jewellers, Joey was immersed in the world of fine jewellery from the age of eight, spending countless hours in his father&apos;s jewellery manufacturing workshop. Surrounded by artisans, gemstones, and the rhythm of creation, he knew early on that this industry was not only his future, but his passion.
            </p>

            <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
              Years later, in 2023, that childhood dream finally took shape. Joey called Charbel with an idea — one that sounded bold, unconventional, and perhaps a little crazy. Charbel laughed, hung up the phone, and dismissed it entirely. But like all ideas rooted in truth, it refused to disappear. Conversations followed. Visions aligned. And soon, what once seemed impossible became inevitable.
            </p>

            <p className="text-lg font-light text-maison-charcoal leading-relaxed italic">
              That idea became Maison Jové.
            </p>

            <div className="pt-4 border-t border-maison-gold/20">
              <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
                Built on trust, friendship, and integrity, Maison Jové was created with one clear purpose: to offer jewellery of the highest quality without the excessive markups that have long defined the industry.
              </p>
            </div>

            <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
              We believe jewellery should be a reward, not a financial burden. A symbol of love, achievement, and meaning — crafted with care, intention, and transparency. By focusing on quality, ethical sourcing, and thoughtful design, Maison Jové challenges the traditional notion that fine jewellery must &ldquo;break the bank&rdquo; to be exceptional.
            </p>

            <p className="text-base font-light text-maison-graphite/80 leading-relaxed">
              Every piece we create reflects our commitment to craftsmanship, value, and honesty. Maison Jové is not just a brand — it is the realisation of a lifelong dream, shaped by friendship, passion, and a desire to make fine jewellery accessible without compromise.
            </p>

            <p className="text-lg font-serif text-maison-charcoal pt-4 italic">
              Welcome to Maison Jové.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
