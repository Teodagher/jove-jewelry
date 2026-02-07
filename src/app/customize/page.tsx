'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart, Star } from 'lucide-react';
import { CustomizationService } from '@/services/customizationService';

interface JewelryItem {
  id: string;
  name: string;
  type: string;
  slug: string;
  description: string | null;
  base_image_url: string | null;
  base_price: number;
  product_type: 'simple' | 'customizable';
  display_order: number;
}

interface PresetDesign {
  id: string;
  jewelry_item_id: string;
  name: string;
  description: string | null;
  slug: string;
  customization_data: Record<string, string>;
  preview_image_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  display_order: number;
  jewelry_item?: JewelryItem;
}

const BADGE_STYLES: Record<string, string> = {
  gold: 'bg-gradient-to-r from-[#d4a574] to-[#b8977e] text-white',
  green: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  red: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
};

export default function CustomizePage() {
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [presets, setPresets] = useState<PresetDesign[]>([]);
  const [presetImages, setPresetImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [siteStyle, setSiteStyle] = useState<string>('original');

  useEffect(() => {
    fetchData();
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setSiteStyle(data.style || 'original'))
      .catch(() => setSiteStyle('original'))
  }, []);

  const fetchData = async () => {
    try {
      // Fetch jewelry items
      const { data: items, error: itemsError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .order('display_order', { ascending: true });

      if (!itemsError && items) {
        setJewelryItems(items);
      }

      // Fetch preset designs
      const { data: presetsData, error: presetsError } = await supabase
        .from('preset_designs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(6); // Show up to 6 presets

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedPresetsData = presetsData as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedItems = items as any[];
      if (!presetsError && typedPresetsData && typedPresetsData.length > 0) {
        setPresets(typedPresetsData);
        
        // Generate preview images for each preset
        const imagePromises = typedPresetsData.map(async (preset) => {
          const item = typedItems?.find((i: { id: string }) => i.id === preset.jewelry_item_id);
          if (item && preset.customization_data) {
            const imageUrl = await CustomizationService.generateVariantImageUrl(
              item.type,
              preset.customization_data
            );
            return { id: preset.id, url: imageUrl };
          }
          return { id: preset.id, url: null };
        });
        
        const images = await Promise.all(imagePromises);
        const imageMap: Record<string, string> = {};
        images.forEach(img => {
          if (img.url) imageMap[img.id] = img.url;
        });
        setPresetImages(imageMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get item info for a preset
  const getItemForPreset = (preset: PresetDesign) => {
    return jewelryItems.find(i => i.id === preset.jewelry_item_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-[#b8977e]/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[#b8977e] rounded-full animate-spin"></div>
          </div>
          <p className="text-[#6b6b6b] font-light tracking-widest text-sm uppercase">Loading Collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]">
          <div className="absolute inset-0 bg-[url('/images/luxury-texture.jpg')] opacity-10 mix-blend-overlay"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#b8977e]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#b8977e]/5 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#b8977e]/60"></div>
            <Sparkles className="w-5 h-5 text-[#b8977e]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#b8977e]/60"></div>
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-wide leading-tight">
            Design Your
            <span className="block italic text-[#d4c4b5]">Masterpiece</span>
          </h1>
          
          <p className="text-white/70 text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Create a piece as unique as your story. Choose your metal, select your gemstone, 
            and craft a timeless symbol of elegance.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-white/50 font-light tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#b8977e]" fill="currentColor" />
              Handcrafted
            </span>
            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#b8977e]" />
              Bespoke
            </span>
            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
            <span>18K Gold</span>
          </div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-2 bg-[#b8977e] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-20 md:py-28 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-[#b8977e] text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              Begin Your Journey
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-[#1a1a1a] mb-6 tracking-wide">
              Choose Your Canvas
            </h2>
            <div className="w-20 h-px bg-[#b8977e]/40 mx-auto"></div>
          </motion.div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {jewelryItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/customize/${item.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden bg-white rounded-sm shadow-sm hover:shadow-xl transition-all duration-500">
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {item.base_image_url ? (
                        <Image
                          src={item.base_image_url}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          priority={index < 4}
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-[#b8977e]/30" />
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* CTA on hover */}
                      <div className="absolute inset-0 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <span className="inline-flex items-center gap-2 text-white text-sm tracking-widest uppercase font-light">
                          Customize Now
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 text-center border-t border-[#f0ece6]">
                      <h3 className="font-serif text-xl md:text-2xl font-light text-[#1a1a1a] mb-2 tracking-wide group-hover:text-[#b8977e] transition-colors duration-300">
                        {item.name}
                      </h3>
                      <p className="text-[#8b8b8b] text-sm font-light">
                        Starting from ${item.base_price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Configurations Section - Dynamic Presets */}
      {presets.length > 0 && (
        <section className="py-20 md:py-28 bg-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6">
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <p className="text-[#b8977e] text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
                Curated For You
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 tracking-wide">
                Signature Editions
              </h2>
              <p className="text-white/60 font-light max-w-xl mx-auto">
                Our most coveted designs, ready to make yours with a single click
              </p>
            </motion.div>

            {/* Configurations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {presets.map((preset, index) => {
                const item = getItemForPreset(preset);
                const previewUrl = presetImages[preset.id] || preset.preview_image_url;
                
                return (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative"
                  >
                    <Link 
                      href={`/customize/${item?.slug || 'necklaces'}?preset=${preset.slug}`}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#2d2d2d] rounded-lg shadow-2xl">
                        {/* Image or Placeholder */}
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt={preset.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#3d3d3d] to-[#2d2d2d]">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-16 h-16 text-[#b8977e]/20" />
                            </div>
                          </div>
                        )}
                        
                        {/* Tag/Badge */}
                        {preset.badge_text && (
                          <div className="absolute top-4 left-4">
                            <span className={`inline-block px-3 py-1.5 text-xs tracking-widest uppercase font-medium rounded-full shadow-lg ${
                              BADGE_STYLES[preset.badge_color || 'gold'] || BADGE_STYLES.gold
                            }`}>
                              {preset.badge_text}
                            </span>
                          </div>
                        )}
                        
                        {/* Content overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#b8977e] text-xs tracking-widest uppercase font-medium">
                              {item?.name || 'Jewelry'}
                            </span>
                          </div>
                          <h3 className="font-serif text-xl md:text-2xl text-white mb-2 group-hover:text-[#d4c4b5] transition-colors duration-300">
                            {preset.name}
                          </h3>
                          <p className="text-white/60 text-sm font-light line-clamp-2">
                            {preset.description || 'Click to customize this design'}
                          </p>
                          
                          {/* CTA */}
                          <div className="mt-4 flex items-center gap-2 text-[#b8977e] text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <span>Customize This Design</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                        
                        {/* Hover border effect */}
                        <div className="absolute inset-0 border-2 border-[#b8977e]/0 group-hover:border-[#b8977e]/50 transition-all duration-500 rounded-lg" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trust/Process Section */}
      <section className="py-20 md:py-28 px-6 bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[#b8977e] text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              The Maison Jové Experience
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#1a1a1a] mb-6 tracking-wide">
              Your Journey, Our Craft
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              { step: "01", title: "Choose", desc: "Select your jewelry type and begin the creative journey" },
              { step: "02", title: "Customize", desc: "Pick your metal, gemstones, and personal touches" },
              { step: "03", title: "Cherish", desc: "Receive your handcrafted masterpiece, made just for you" }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <span className="text-5xl font-serif text-[#b8977e]/20 font-light">{item.step}</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a] mt-2 mb-3">{item.title}</h3>
                <p className="text-[#6b6b6b] font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
