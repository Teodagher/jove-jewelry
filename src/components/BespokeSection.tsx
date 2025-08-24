import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function BespokeSection() {
  const jewelryItems = [
    {
      name: 'BRACELETS',
      description: 'Elegant chains and charm bracelets with customizable stones and metals',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/bracelet-preview.png',
      link: '/customize/bracelets'
    },
    {
      name: 'NECKLACES',
      description: 'Beautiful pendants and chains designed to complement your style',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/necklace.png',
      link: '/customize/necklaces'
    },
    {
      name: 'RINGS',
      description: 'Stunning rings with precious stones and customizable settings',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/ring%20-preview.png',
      link: '/customize/rings'
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-zinc-800">
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

        {/* Stylish Responsive Jewelry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {jewelryItems.map((item, index) => (
            <Link key={item.name} href={item.link} className="group">
              <div className="relative overflow-hidden bg-stone-50 border border-amber-100 hover:border-amber-300 transition-all duration-300 group-hover:shadow-xl rounded-lg sm:rounded-none">
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                
                {/* Image Container - Responsive height */}
                <div className="relative h-64 sm:h-72 lg:h-80 bg-orange-50 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-4 sm:p-6 lg:p-8 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Content - Mobile optimized */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-light mb-2 sm:mb-3 lg:mb-4 tracking-wide text-gray-900 group-hover:text-black transition-colors">
                    {item.name}
                  </h3>
                  
                  {/* Mobile: Hide description, Tablet+: Show description */}
                  <p className="hidden sm:block text-sm lg:text-base text-gray-600 leading-relaxed mb-4 lg:mb-6">
                    {item.description}
                  </p>
                  
                  {/* Mobile: Show simplified CTA */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 tracking-wide">Customize</span>
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tablet+: Show full CTA */}
                  <div className="hidden sm:flex items-center text-gray-900 font-medium group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-sm tracking-wide">Customize Now</span>
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
