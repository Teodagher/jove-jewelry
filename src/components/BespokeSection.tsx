'use client';

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
  category_id: string | null;
}

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  items: JewelryItem[];
}

export default function BespokeSection() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesAndItems();

    // Check if we should scroll to this section
    const shouldScroll = sessionStorage.getItem('scrollToCustomize');
    if (shouldScroll === 'true') {
      sessionStorage.removeItem('scrollToCustomize');
      // Wait a bit for the section to render
      setTimeout(() => {
        const element = document.getElementById('customize');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);

  const fetchCategoriesAndItems = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Fetch all customizable jewelry items
      const { data: itemsData, error: itemsError } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('Error fetching jewelry items:', itemsError);
        return;
      }

      // Group items by category
      const categoriesWithItems: ProductCategory[] = (categoriesData || []).map((category: any) => ({
        ...category,
        items: (itemsData || []).filter((item: any) => item.category_id === category.id)
      }));

      // Filter out empty categories and categories without items
      const nonEmptyCategories = categoriesWithItems.filter(cat => cat.items.length > 0);

      setCategories(nonEmptyCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 md:py-32 lg:py-40 bg-maison-charcoal">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-maison-gold mx-auto mb-4"></div>
            <p className="text-maison-ivory/60 font-light">Loading collection...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="customize" className="py-24 md:py-32 lg:py-40 bg-maison-charcoal overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-maison-gold text-xs md:text-sm tracking-[0.3em] uppercase mb-4 font-medium">
            Bespoke Creations
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 tracking-wide">
            Customise Your Jewellery
          </h2>
          <div className="w-20 h-px bg-maison-gold mx-auto mb-8" />
          <p className="text-white/60 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            Create unique pieces that reflect your personal style. Choose your metals, select your gemstones, and watch your vision come to life.
          </p>
        </motion.div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={`/customize/category/${category.slug}`} className="group block">
                <div className="relative overflow-hidden bg-maison-ivory transition-all duration-500 group-hover:shadow-2xl">
                  {/* Gold accent line */}
                  <div className="absolute top-0 left-0 w-full h-px bg-maison-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 z-10" />

                  {/* Image Container */}
                  <div className="relative aspect-[4/5] bg-maison-cream overflow-hidden">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-maison-warm">
                        <span className="text-maison-graphite/40 font-light">No Image</span>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-maison-black/0 group-hover:bg-maison-black/10 transition-all duration-500" />
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-serif text-xl md:text-2xl font-light text-maison-black mb-2 tracking-wide group-hover:text-maison-gold transition-colors duration-300">
                          {category.name}
                        </h3>
                        
                        {category.description && (
                          <p className="hidden md:block text-maison-graphite/70 text-sm font-light leading-relaxed mb-4">
                            {category.description}
                          </p>
                        )}
                        
                        <p className="text-maison-gold text-xs tracking-wider">
                          {category.items.length} {category.items.length === 1 ? 'Design' : 'Designs'}
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex-shrink-0 w-10 h-10 border border-maison-warm rounded-full flex items-center justify-center group-hover:border-maison-gold group-hover:bg-maison-gold/5 transition-all duration-300">
                        <ArrowRight size={16} strokeWidth={1.5} className="text-maison-graphite group-hover:text-maison-gold transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
