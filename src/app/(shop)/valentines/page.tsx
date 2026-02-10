'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Gift, Sparkles } from 'lucide-react'

// Product images from the website
const CATEGORY_IMAGES = {
  rings: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/categories-pictures/categories/1770078449145-8c8f3318-87bc-40bb-b2ac-a59442c91e68-jeqzw2yofh.webp',
  necklaces: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/categories-pictures/categories/1762309613782-img_5770-9ivq5gxn9ns.webp',
  bracelets: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/categories-pictures/categories/1770078437642-5c460a20-40cb-4a90-af65-53c62ac3461e-c7mt1mp7iq.webp',
  earrings: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/categories-pictures/categories/1762309553406-img_5758-uf881gb6yz.webp',
}

const PRODUCT_IMAGES = {
  bondBracelet: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1762173357451-img_5313-removebg-preview-id88xgcc277.webp',
  necklace: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1762173385426-img_0781-removebg-preview-te7dwf5nf8.webp',
  bracelet: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1770076090240-3b987adf-cc7a-418b-901f-f7db85ca50cb-4jcpfx6wjqv.webp',
  earrings: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1762173371481-img_5312-removebg-preview-slhccat4b5.webp',
  meridianBracelet: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/products/1770076164625-6ea116c7-8303-4ee3-ae09-f046ed8fdecf-2ewj7wzwdox.webp',
}

export default function ValentinesEditPage() {
  return (
    <div className="min-h-screen bg-maison-ivory">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-b from-rose-50 to-maison-ivory">
        <div className="max-w-4xl mx-auto">
          <Heart className="w-12 h-12 text-rose-400 mx-auto mb-6" />
          <h1 className="font-serif text-4xl md:text-5xl font-light text-maison-black tracking-wide mb-6">
            The Valentine&apos;s Edit
          </h1>
          <p className="text-lg md:text-xl text-maison-graphite font-light leading-relaxed max-w-2xl mx-auto">
            A curated selection of pieces made for connection, meaning, and love. 
            From Toi et Moi creations to ruby cord bracelets, each piece is crafted to be shared.
          </p>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-4">
              Shop the Valentine&apos;s Collection
            </h2>
            <p className="text-maison-graphite font-light max-w-xl mx-auto leading-relaxed">
              Find the perfect piece for your valentine
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { name: 'Rings', slug: 'rings', image: CATEGORY_IMAGES.rings },
              { name: 'Necklaces', slug: 'necklaces', image: CATEGORY_IMAGES.necklaces },
              { name: 'Bracelets', slug: 'bracelets', image: CATEGORY_IMAGES.bracelets },
              { name: 'Earrings', slug: 'earrings', image: CATEGORY_IMAGES.earrings },
            ].map((category) => (
              <Link 
                key={category.slug}
                href={`/customize/category/${category.slug}`}
                className="group"
              >
                <div className="aspect-square bg-gradient-to-br from-rose-50 to-maison-cream rounded-lg mb-4 overflow-hidden relative">
                  <Image 
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-serif text-lg text-maison-charcoal text-center group-hover:text-rose-500 transition-colors">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Toi et Moi Section */}
      <section className="py-16 px-4 md:px-8 bg-rose-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-4">
              Toi et Moi
            </h2>
            <p className="text-maison-graphite font-light max-w-xl mx-auto leading-relaxed">
              Two stones. Two souls. One story. Our Toi et Moi creations symbolize 
              two individuals coming together in one piece.
            </p>
          </div>
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {[
              { name: 'Toi et Moi Ring', slug: 'rings', image: CATEGORY_IMAGES.rings },
              { name: 'Toi et Moi Necklace', slug: 'necklaces', image: PRODUCT_IMAGES.necklace },
              { name: 'Toi et Moi Bracelet', slug: 'bracelets', image: PRODUCT_IMAGES.bracelet },
            ].map((item, i) => (
              <Link key={i} href={`/customize/category/${item.slug}`} className="group">
                <div className="aspect-square bg-white rounded-lg mb-4 overflow-hidden relative shadow-sm">
                  <Image 
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-serif text-lg text-maison-charcoal text-center group-hover:text-rose-500 transition-colors">{item.name}</h3>
                <p className="text-sm text-maison-graphite text-center mt-1">Made for two</p>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              href="/customize"
              className="inline-block px-8 py-3 bg-maison-black text-white font-light tracking-wider hover:bg-maison-charcoal transition-colors"
            >
              Design a Toi et Moi
            </Link>
          </div>
        </div>
      </section>

      {/* Matching Bracelets Section */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-4">
              A Bracelet for You. A Bracelet for Them.
            </h2>
            <p className="text-maison-graphite font-light max-w-xl mx-auto leading-relaxed">
              Choose your cord. Choose your stone. Create matching bracelets 
              that connect you, wherever you are.
            </p>
          </div>
          
          {/* Bracelet Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { name: 'Classic Bracelet', image: PRODUCT_IMAGES.bracelet, price: 'From $160', slug: 'bracelets' },
              { name: 'Bond Bracelet', image: PRODUCT_IMAGES.bondBracelet, price: 'From $80', slug: 'bond-bracelet' },
              { name: 'Meridian Bracelet', image: PRODUCT_IMAGES.meridianBracelet, price: 'From $120', slug: 'the-meridian-mark-' },
              { name: 'Ring', image: CATEGORY_IMAGES.rings, price: 'From $200', slug: 'rings' },
            ].map((item, i) => (
              <Link key={i} href={`/customize/${item.slug}`} className="group text-center">
                <div className="aspect-square bg-gradient-to-br from-rose-50 to-white rounded-lg overflow-hidden relative shadow-sm mb-3">
                  <Image 
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm text-maison-charcoal font-medium">{item.name}</p>
                <p className="text-xs text-maison-graphite">{item.price}</p>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              href="/customize/category/bracelets"
              className="inline-block px-8 py-3 bg-maison-black text-white font-light tracking-wider hover:bg-maison-charcoal transition-colors"
            >
              Create Matching Bracelets
            </Link>
          </div>
        </div>
      </section>

      {/* Gifting Section */}
      <section className="py-16 px-4 md:px-8 bg-rose-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Gift className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-4">
              Thoughtful pieces for every love story and every budget.
            </h2>
          </div>
          
          {/* Gift Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Under $150 */}
            <Link href="/customize/category/bracelets" className="group">
              <div className="bg-white rounded-xl p-6 h-full hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-rose-50 to-maison-cream rounded-lg mb-4 overflow-hidden relative">
                  <Image 
                    src={PRODUCT_IMAGES.bondBracelet}
                    alt="Gifts under $150"
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="font-serif text-xl text-maison-black mb-2 text-center group-hover:text-rose-500 transition-colors">Gifts under $150</h3>
                <p className="text-sm text-maison-graphite text-center mb-4">Meaningful, entry-level gifts</p>
                <ul className="space-y-2 text-sm text-maison-charcoal">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Bond bracelets with gold charms
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Cord bracelets with small diamonds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Minimal silver pieces
                  </li>
                </ul>
              </div>
            </Link>

            {/* Under $300 */}
            <Link href="/customize" className="group">
              <div className="bg-white rounded-xl p-6 border-2 border-rose-200 h-full hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-rose-50 to-maison-cream rounded-lg mb-4 overflow-hidden relative">
                  <Image 
                    src={PRODUCT_IMAGES.necklace}
                    alt="Gifts under $300"
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <h3 className="font-serif text-xl text-maison-black mb-2 text-center group-hover:text-rose-500 transition-colors">Gifts under $300</h3>
                <p className="text-sm text-maison-graphite text-center mb-4">Premium & giftable</p>
                <ul className="space-y-2 text-sm text-maison-charcoal">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Gold necklaces with diamonds
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Classic bracelets with rubies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">♥</span>
                    Elegant earrings
                  </li>
                </ul>
              </div>
            </Link>

            {/* Statement Pieces */}
            <Link href="/customize/category/rings" className="group">
              <div className="bg-gradient-to-br from-maison-black to-zinc-800 rounded-xl p-6 text-white h-full hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-white/10 rounded-lg mb-4 overflow-hidden relative">
                  <Image 
                    src={CATEGORY_IMAGES.rings}
                    alt="Statement Pieces"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-serif text-xl mb-2 text-center">Statement Pieces</h3>
                <p className="text-sm text-zinc-300 text-center mb-4">Romantic centerpieces</p>
                <ul className="space-y-2 text-sm text-zinc-100">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-300">♥</span>
                    Toi et Moi rings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-300">♥</span>
                    Bold diamond pieces
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-300">♥</span>
                    Custom gold creations
                  </li>
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-white to-rose-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-rose-500 text-sm font-light tracking-widest mb-4">MADE TO BE SHARED</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-6">
            A story only you can design.
          </h2>
          <Link 
            href="/customize"
            className="inline-block px-10 py-4 bg-rose-500 text-white font-light tracking-wider hover:bg-rose-600 transition-colors"
          >
            Create Your Valentine&apos;s Piece
          </Link>
        </div>
      </section>
    </div>
  )
}
