'use client';

import Script from 'next/script';

export default function InstagramFeed() {
  return (
    <section className="py-16 md:py-24 bg-maison-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-charcoal tracking-wider">
            Follow Us
          </h2>
          <div className="maison-gold-line mx-auto my-4" />
          <p className="text-maison-graphite font-light tracking-wide">
            @maisonjove
          </p>
        </div>
        <div className="elfsight-app-b0b98180-6e8a-47f5-ba21-729ac3064e99" data-elfsight-app-lazy></div>
      </div>
      <Script src="https://static.elfsight.com/platform/platform.js" strategy="lazyOnload" />
    </section>
  );
}
