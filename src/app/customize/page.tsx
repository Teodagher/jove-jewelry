'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

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


  useEffect(() => {
    fetchJewelryItems();
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
    <div className="min-h-screen jove-bg-primary flex items-center justify-center px-4 py-8">
      <div className="max-w-6xl w-full mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-8 sm:mb-12 md:mb-16 tracking-wide text-zinc-900">
          Choose Your Jewelry Type
        </h1>
        
        {/* Mobile: Stack vertically, Desktop: Horizontal row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {jewelryItems.map((item) => (
            <Link
              key={item.id}
              href={`/customize/${item.slug}`}
              className="group flex flex-col items-center transition-all duration-300 hover:scale-105"
            >
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-4 group-hover:scale-110 transition-transform duration-300 relative"
              >
                {item.base_image_url ? (
                  <Image
                    src={item.base_image_url}
                    alt={`Custom ${item.name.toLowerCase()}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority={item.display_order === 1}
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-light text-zinc-900 group-hover:text-zinc-700 transition-colors tracking-wide text-center">
                {item.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
