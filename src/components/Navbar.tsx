'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import AnimatedScrollButton from '@/components/AnimatedScrollButton'
import { supabase } from '@/lib/supabase/client'

interface JewelryItem {
  id: string
  name: string
  slug: string
  display_order: number
}

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch jewelry items from Supabase
  useEffect(() => {
    const fetchJewelryItems = async () => {
      const { data, error } = await supabase
        .from('jewelry_items')
        .select('id, name, slug, display_order')
        .eq('is_active', true)
        .eq('product_type', 'customizable')
        .order('display_order', { ascending: true })

      if (!error && data) {
        setJewelryItems(data)
      }
    }

    fetchJewelryItems()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 text-lg font-light text-zinc-800 hover:text-zinc-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-orange-50 font-serif tracking-wide"
        >
          <span className="text-xl font-light tracking-wider">CUSTOMIZE YOUR</span>
          <ChevronDown 
            size={18} 
            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
            strokeWidth={1.5}
          />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-3 w-56 bg-stone-50 border border-amber-200 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-[9999] overflow-hidden">
            <div className="py-2 divide-y divide-zinc-100">
              {jewelryItems.length > 0 ? (
                jewelryItems.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/customize/${item.slug}`}
                    className={`
                      block px-6 py-4 text-sm font-light text-zinc-800 hover:text-zinc-900
                      hover:bg-zinc-50 transition-all duration-300 tracking-widest
                      cursor-pointer relative z-10
                      ${index === 0 ? 'rounded-t-lg' : ''}
                      ${index === jewelryItems.length - 1 ? 'rounded-b-lg' : ''}
                    `}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center justify-between group">
                      <span>{item.name.toUpperCase()}</span>
                      <span className="text-zinc-300 group-hover:text-zinc-800 transition-colors duration-300">→</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-4 text-sm text-gray-500 text-center">
                  No products available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* About Us Link */}
      <AnimatedScrollButton
        targetId="about"
        className="text-xl font-light text-zinc-800 hover:text-zinc-900 transition-all duration-300 py-3 px-4 rounded-lg hover:bg-zinc-50 font-serif tracking-wider"
      >
        ABOUT US
      </AnimatedScrollButton>
    </nav>
  )
} 