import Link from 'next/link'
import Image from 'next/image'

export default function CustomizePage() {
  const categories = [
    {
      name: 'Rings',
      href: '/customize/rings',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/ring-preview.webp',
      alt: 'Custom ring design'
    },
    {
      name: 'Bracelets',
      href: '/customize/bracelets',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/bracelet-preview.webp',
      alt: 'Custom bracelet design'
    },
    {
      name: 'Necklaces',
      href: '/customize/necklaces',
      image: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/necklace.webp',
      alt: 'Custom necklace design'
    }
  ]

  return (
    <div className="min-h-screen jove-bg-primary flex items-center justify-center px-4 py-8">
      <div className="max-w-6xl w-full mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-8 sm:mb-12 md:mb-16 tracking-wide text-zinc-900">
          Choose Your Jewelry Type
        </h1>
        
        {/* Mobile: Stack vertically, Desktop: Horizontal row */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex flex-col items-center transition-all duration-300 hover:scale-105"
            >
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-4 group-hover:scale-110 transition-transform duration-300 relative"
              >
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  priority={category.name === 'Bracelets'}
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-light text-zinc-900 group-hover:text-zinc-700 transition-colors tracking-wide text-center">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
