'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface PresetItem {
  id: string;
  name: string;
  slug: string;
  preview_image_url: string | null;
  item_name: string;
  item_slug: string;
  item_type: string;
}

export default function OurWorkPresets() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('preset_designs')
          .select(`
            id, name, slug, preview_image_url,
            jewelry_items!inner(name, slug, type)
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: PresetItem[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            preview_image_url: p.preview_image_url,
            item_name: p.jewelry_items.name,
            item_slug: p.jewelry_items.slug,
            item_type: p.jewelry_items.type,
          }));
          setPresets(mapped);
        }
      } catch (err) {
        console.error('Error fetching presets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  // Measure one set of items for the scroll distance
  useEffect(() => {
    if (!trackRef.current || presets.length === 0) return;
    const measure = () => {
      if (trackRef.current) {
        // Total width / 3 (we triplicate items)
        setTrackWidth(trackRef.current.scrollWidth / 3);
      }
    };
    // Wait a frame for images to affect layout
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [presets]);

  const duplicated = [...presets, ...presets, ...presets];

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      ring: 'Ring',
      necklace: 'Necklace',
      bracelet: 'Bracelet',
      earrings: 'Earrings',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <section className="relative bg-maison-ivory">
        <div className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-maison-warm rounded w-40 mx-auto mb-4" />
              <div className="h-3 bg-maison-warm rounded w-64 mx-auto" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (presets.length === 0) return null;

  const duration = presets.length * 14;

  return (
    <section id="our-work" className="py-24 md:py-32 lg:py-40 bg-maison-ivory overflow-hidden">
      {/* Keyframe for infinite scroll */}
      {trackWidth > 0 && (
        <style>{`
          @keyframes our-work-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${trackWidth}px); }
          }
        `}</style>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-14 md:mb-18 px-6"
      >
        <p className="text-maison-gold/80 text-[10px] md:text-xs tracking-[0.35em] uppercase mb-5 font-light">
          Portfolio
        </p>
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-maison-black/90 mb-6 tracking-wide">
          Our Work
        </h2>
        <div className="w-16 h-px bg-maison-gold/50 mx-auto" />
      </motion.div>

      {/* Infinite Scroll Carousel */}
      <div className="relative">
        {/* Gradient fade edges — left & right */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 lg:w-28 bg-gradient-to-r from-maison-ivory to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 lg:w-28 bg-gradient-to-l from-maison-ivory to-transparent z-10 pointer-events-none" />

        {/* Gradient fade edges — top & bottom */}
        <div className="absolute top-0 left-0 right-0 h-8 md:h-12 bg-gradient-to-b from-maison-ivory to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-8 md:h-12 bg-gradient-to-t from-maison-ivory to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-5 md:gap-6 w-max"
            style={trackWidth > 0 ? {
              animation: `our-work-scroll ${duration}s linear infinite`,
              willChange: 'transform',
            } : undefined}
          >
            {duplicated.map((preset, index) => (
              <Link
                key={`${preset.id}-${index}`}
                href={`/customize/${preset.item_slug}?preset=${preset.slug}`}
                className="group relative flex-shrink-0 w-[220px] md:w-[270px] lg:w-[310px]"
              >
                <div className="relative aspect-[4/5] bg-maison-cream/60 overflow-hidden">
                  {preset.preview_image_url ? (
                    <Image
                      src={preset.preview_image_url}
                      alt={`${preset.name} - ${formatType(preset.item_type)}`}
                      fill
                      className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 220px, (max-width: 1024px) 270px, 310px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-maison-warm/40">
                      <span className="text-maison-graphite/20 font-light text-xs tracking-wider">No Preview</span>
                    </div>
                  )}

                  {/* Hover overlay — soft dark veil rising from bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-maison-black/60 via-maison-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

                  {/* Gold accent line — scales in from center on hover */}
                  <div className="absolute bottom-0 left-0 w-full h-px bg-maison-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out z-10" />

                  {/* Title overlay — slides up on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                    <p className="text-white/70 text-[9px] md:text-[10px] tracking-[0.3em] uppercase mb-1.5 font-light">
                      {formatType(preset.item_type)}
                    </p>
                    <p className="font-serif text-base md:text-lg font-light text-white tracking-wide leading-tight">
                      {preset.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
