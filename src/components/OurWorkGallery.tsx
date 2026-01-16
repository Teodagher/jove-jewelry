'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
}

interface WebsiteImage {
  id: string;
  image_url: string;
  alt_text: string | null;
}

export default function OurWorkGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const { data, error } = await supabase
          .from('website_images')
          .select('id, image_url, alt_text')
          .eq('section', 'our_work')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const typedData = data as unknown as WebsiteImage[];
          setImages(typedData.map(img => ({
            id: img.id,
            url: img.image_url,
            alt: img.alt_text || 'Maison Jové craftsmanship'
          })));
        } else {
          // Fallback to hero images if no our_work images exist
          const { data: heroData } = await supabase
            .from('website_images')
            .select('id, image_url, alt_text')
            .eq('section', 'hero')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .limit(8);

          if (heroData && heroData.length > 0) {
            const typedHeroData = heroData as unknown as WebsiteImage[];
            setImages(typedHeroData.map(img => ({
              id: img.id,
              url: img.image_url,
              alt: img.alt_text || 'Maison Jové craftsmanship'
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  // Duplicate images for seamless infinite scroll
  const duplicatedImages = [...images, ...images, ...images];

  if (loading) {
    return (
      <section id="our-work" className="py-24 md:py-32 bg-maison-black">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-maison-graphite/20 rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-maison-graphite/20 rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section id="our-work" className="py-24 md:py-32 lg:py-40 bg-maison-black overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 md:mb-20 px-6"
      >
        <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
          Portfolio
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 tracking-wide">
          Our Work
        </h2>
        <div className="w-20 h-px bg-maison-gold mx-auto mb-8" />
        <p className="text-white/60 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
          A living archive of bespoke creations, each piece telling its own unique story.
        </p>
      </motion.div>

      {/* Infinite Scroll Gallery */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-maison-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-maison-black to-transparent z-10 pointer-events-none" />

        {/* Scrolling container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-hidden"
        >
          <motion.div
            className="flex gap-6"
            animate={{
              x: isPaused ? undefined : [0, -100 * images.length + '%']
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: images.length * 8,
                ease: 'linear'
              }
            }}
            style={{ willChange: 'transform' }}
          >
            {duplicatedImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className="relative flex-shrink-0 w-[300px] md:w-[400px] lg:w-[500px] aspect-[4/5] group cursor-pointer"
              >
                <Image
                  src={image.url}
                  alt={image.alt || 'Maison Jové creation'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 300px, (max-width: 1024px) 400px, 500px"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-maison-black/0 group-hover:bg-maison-black/30 transition-all duration-500" />
                {/* Gold border on hover */}
                <div className="absolute inset-0 border border-transparent group-hover:border-maison-gold/50 transition-all duration-500" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-center text-white/40 text-sm tracking-wider mt-12 md:mt-16 px-6"
      >
        Each creation is a testament to our dedication to excellence
      </motion.p>
    </section>
  );
}
