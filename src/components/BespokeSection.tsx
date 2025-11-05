'use client';

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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
      <section className="py-12 sm:py-16 lg:py-24 bg-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading jewelry collection...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="customize" className="py-12 sm:py-16 lg:py-24 bg-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Responsive Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 tracking-wide text-white">
            CUSTOMIZE YOUR JEWELRY
          </h2>
          {/* Mobile: Condensed description */}
          <p className="text-base sm:hidden text-gray-300 max-w-sm mx-auto leading-relaxed">
            Create unique jewelry that reflects your personal style.
          </p>
          {/* Tablet and Desktop: Full description */}
          <p className="hidden sm:block text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Create unique bracelets, necklaces, and rings that reflect your personal style.
            Our online customization tool makes it easy to design the perfect piece.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((category) => (
            <Link key={category.id} href={`/customize/category/${category.slug}`} className="group">
              <div className="relative overflow-hidden bg-stone-50 border border-amber-100 hover:border-amber-300 transition-all duration-300 group-hover:shadow-xl rounded-lg sm:rounded-none">
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                {/* Image Container - Responsive height */}
                <div className="relative aspect-square bg-orange-50 overflow-hidden">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content - Mobile optimized */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-light mb-2 sm:mb-3 lg:mb-4 tracking-wide text-gray-900 group-hover:text-black transition-colors">
                    {category.name}
                  </h3>

                  {/* Mobile: Hide description, Tablet+: Show description */}
                  {category.description && (
                    <p className="hidden sm:block text-sm lg:text-base text-gray-600 leading-relaxed mb-4 lg:mb-6">
                      {category.description}
                    </p>
                  )}

                  {/* Product count badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {category.items.length} {category.items.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  {/* Mobile: Show simplified CTA */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 tracking-wide">Explore</span>
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Tablet+: Show full CTA */}
                  <div className="hidden sm:flex items-center text-gray-900 font-medium group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-sm tracking-wide">Explore {category.name}</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
