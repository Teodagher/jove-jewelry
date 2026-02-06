'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Gift, Sparkles } from 'lucide-react'

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

      {/* Toi et Moi Section */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-maison-black mb-4">
              Toi et Moi
            </h2>
            <p className="text-maison-graphite font-light max-w-xl mx-auto leading-relaxed">
              Two stones. Two souls. One story. Our Toi et Moi creations symbolize 
              two individuals coming together in one timeless piece.
            </p>
          </div>
          
          {/* Product Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {['Toi et Moi Ring', 'Toi et Moi Necklace', 'Toi et Moi Bracelet'].map((item, i) => (
              <div key={i} className="group">
                <div className="aspect-square bg-gradient-to-br from-rose-100 to-maison-cream rounded-lg mb-4 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-rose-300 group-hover:text-rose-400 transition-colors" />
                </div>
                <h3 className="font-serif text-lg text-maison-charcoal text-center">{item}</h3>
                <p className="text-sm text-maison-graphite text-center mt-1">Made for two</p>
              </div>
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
      <section className="py-16 px-4 md:px-8 bg-rose-50/50">
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
          
          {/* Bracelet Pairs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { color: 'Red Cord', accent: 'bg-red-400' },
              { color: 'Navy Cord', accent: 'bg-blue-900' },
              { color: 'Black Cord', accent: 'bg-zinc-800' },
              { color: 'Burgundy Cord', accent: 'bg-rose-900' },
            ].map((cord, i) => (
              <div key={i} className="text-center">
                <div className="aspect-square bg-white rounded-lg shadow-sm flex items-center justify-center mb-3 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${cord.accent}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-20 h-1 ${cord.accent} rounded-full mb-2`} />
                    <div className="w-4 h-4 bg-amber-400 rounded-full" />
                    <div className={`w-20 h-1 ${cord.accent} rounded-full mt-2`} />
                  </div>
                </div>
                <p className="text-sm text-maison-charcoal">{cord.color}</p>
                <p className="text-xs text-maison-graphite">with gold & ruby</p>
              </div>
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
      <section className="py-16 px-4 md:px-8 bg-white">
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
            <div className="bg-maison-cream/50 rounded-xl p-6">
              <h3 className="font-serif text-xl text-maison-black mb-2 text-center">Gifts under $150</h3>
              <p className="text-sm text-maison-graphite text-center mb-6">Meaningful, entry-level gifts</p>
              <ul className="space-y-3 text-sm text-maison-charcoal">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Single cord bracelets with small gold charms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Cord bracelets with a single ruby or small diamond
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Minimal gold cord bracelets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Simple gold charm bracelets
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href="/customize" className="text-sm text-maison-black underline underline-offset-4 hover:text-rose-600 transition-colors">
                  Shop Under $150 →
                </Link>
              </div>
            </div>

            {/* Under $300 */}
            <div className="bg-rose-50 rounded-xl p-6 border border-rose-200">
              <h3 className="font-serif text-xl text-maison-black mb-2 text-center">Gifts under $300</h3>
              <p className="text-sm text-maison-graphite text-center mb-6">Premium & giftable</p>
              <ul className="space-y-3 text-sm text-maison-charcoal">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Cord bracelets with larger stones
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Small gold pendants with rubies or diamonds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Delicate Toi et Moi bracelets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Minimal gold necklaces with a single stone
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">♥</span>
                  Customizable charm bracelets
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href="/customize" className="text-sm text-maison-black underline underline-offset-4 hover:text-rose-600 transition-colors">
                  Shop Under $300 →
                </Link>
              </div>
            </div>

            {/* Statement Pieces */}
            <div className="bg-gradient-to-br from-maison-black to-zinc-800 rounded-xl p-6 text-white">
              <h3 className="font-serif text-xl mb-2 text-center">Statement Pieces</h3>
              <p className="text-sm text-zinc-300 text-center mb-6">Romantic centerpieces</p>
              <ul className="space-y-3 text-sm text-zinc-100">
                <li className="flex items-start gap-2">
                  <span className="text-rose-300">♥</span>
                  Toi et Moi rings with two stones
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-300">♥</span>
                  Toi et Moi necklaces
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-300">♥</span>
                  Bold ruby or diamond bracelets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-300">♥</span>
                  High-impact customized pieces in gold
                </li>
              </ul>
              <div className="mt-6 text-center">
                <Link href="/customize" className="text-sm text-white underline underline-offset-4 hover:text-rose-300 transition-colors">
                  Shop Statement Pieces →
                </Link>
              </div>
            </div>
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
