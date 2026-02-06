'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// Valentine's intro component
function ValentinesIntro({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="text-center mb-8">
      <p className="text-rose-500 text-sm font-light tracking-widest mb-3">♥ VALENTINE&apos;S SPECIAL</p>
      <p className="text-maison-graphite text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
        This Valentine&apos;s, don&apos;t just give jewellery. Give a piece that was designed for them, by you.
      </p>
    </div>
  )
}

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

export default function CustomizePage() {
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteStyle, setSiteStyle] = useState<string>('original');

  useEffect(() => {
    fetchJewelryItems();
    // Fetch site style
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setSiteStyle(data.style || 'original'))
      .catch(() => setSiteStyle('original'))
  }, []);

  const fetchJewelryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('*')
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .order('display_order', { ascending: true });

      if (error) {
        return;
      }

      setJewelryItems(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jewelry collection...</p>
        </div>
      </div>
    );
  }

  if (jewelryItems.length === 0) {
    return (
      <div className="min-h-screen jove-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Products Available</h1>
          <p className="text-gray-600 mb-6">There are currently no customizable products available.</p>
          <Link
            href="/"
            className="px-6 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-900 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen jove-bg-primary px-4 py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl w-full mx-auto">
        {/* Valentine's Campaign Intro - only when style is active */}
        <ValentinesIntro show={siteStyle === 'valentines'} />
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-12 sm:mb-16 md:mb-20 tracking-wide text-zinc-900">
          Choose Your Jewelry Type
        </h1>

        {/* Centered Flex Layout */}
        <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {jewelryItems.map((item) => (
            <Link
              key={item.id}
              href={`/customize/${item.slug}`}
              className="group flex flex-col items-center transition-all duration-300 hover:scale-105 w-32 sm:w-36 md:w-40 lg:w-44"
            >
              <div
                className="w-full aspect-square mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 relative"
              >
                {item.base_image_url ? (
                  <Image
                    src={item.base_image_url}
                    alt={`Custom ${item.name.toLowerCase()}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority={item.display_order <= 5}
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs sm:text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-zinc-900 group-hover:text-zinc-700 transition-colors tracking-wide text-center">
                {item.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
