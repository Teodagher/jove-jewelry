import { Button } from '@/components/ui/button'
import { Circle, Link, Gem } from 'lucide-react'

export default function BespokeSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light mb-8 tracking-wide">CUSTOMIZE YOUR JEWELRY</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create unique bracelets, necklaces, and earrings that reflect your personal style.
            Our online customization tool makes it easy to design the perfect piece.
          </p>
        </div>

        {/* Product Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center group cursor-pointer">
            <div className="bg-zinc-50 rounded-lg p-8 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="flex justify-center mb-4">
                <Circle className="w-12 h-12 text-zinc-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium mb-2 tracking-wide">BRACELETS</h3>
              <p className="text-gray-600 text-sm">Elegant chains, charm bracelets, and tennis styles</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer">
            <div className="bg-zinc-50 rounded-lg p-8 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="flex justify-center mb-4">
                <Link className="w-12 h-12 text-zinc-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium mb-2 tracking-wide">NECKLACES</h3>
              <p className="text-gray-600 text-sm">Pendants, chains, and statement pieces</p>
            </div>
          </div>
          <div className="text-center group cursor-pointer">
            <div className="bg-zinc-50 rounded-lg p-8 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="flex justify-center mb-4">
                <Gem className="w-12 h-12 text-zinc-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium mb-2 tracking-wide">EARRINGS</h3>
              <p className="text-gray-600 text-sm">Studs, hoops, and drop earrings</p>
            </div>
          </div>
        </div>

        {/* Customization Process */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6">
            <div className="text-6xl font-light text-zinc-300 mb-4">01</div>
            <h3 className="text-xl font-medium mb-4 tracking-wide">CHOOSE YOUR STYLE</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Select from our collection of beautiful bracelet, necklace, and earring designs.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-6xl font-light text-zinc-300 mb-4">02</div>
            <h3 className="text-xl font-medium mb-4 tracking-wide">CUSTOMIZE DETAILS</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pick your metals, gemstones, sizes, and add personal engravings to make it uniquely yours.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-6xl font-light text-zinc-300 mb-4">03</div>
            <h3 className="text-xl font-medium mb-4 tracking-wide">RECEIVE & ENJOY</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your handcrafted piece is made to order and delivered directly to your door with care.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="default"
            size="lg"
            className="bg-zinc-900 text-white hover:bg-zinc-800 px-8 py-3 text-base tracking-wider"
          >
            START DESIGNING NOW
          </Button>
        </div>
      </div>
    </section>
  )
}
