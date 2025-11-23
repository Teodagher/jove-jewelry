'use client'

import Script from 'next/script'

export default function InstagramSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-3 tracking-wide">
            Follow Us on Instagram
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Stay connected and see our latest creations
          </p>
        </div>

        {/* Elfsight Instagram Feed */}
        <div className="elfsight-app-b0b98180-6e8a-47f5-ba21-729ac3064e99" data-elfsight-app-lazy></div>
        <Script
          src="https://static.elfsight.com/platform/platform.js"
          strategy="lazyOnload"
        />
      </div>
    </section>
  )
}
