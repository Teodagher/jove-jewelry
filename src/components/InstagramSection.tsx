'use client'

import Script from 'next/script'

export default function InstagramSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
            Follow Us on Instagram
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
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
