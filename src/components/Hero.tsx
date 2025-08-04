import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100">
      {/* Content */}
      <div className="relative z-10 text-center text-zinc-900 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-light mb-6 tracking-wide">
          CUSTOMIZE YOUR STORY
        </h1>
        <p className="text-xl md:text-2xl font-light mb-8 tracking-wide text-zinc-600">
          Create custom bracelets, necklaces, earrings, and more.
        </p>
        <p className="text-lg text-zinc-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Choose your metals, select your gemstones.
          Handcrafted to perfection and delivered to your door.
        </p>

        <div className="flex justify-center">
          <Link href="/customize">
            <Button
              size="lg"
              className="bg-zinc-900 text-white hover:bg-zinc-800 px-8 py-3 text-lg tracking-wider"
            >
              START CUSTOMIZING
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
