export default function CraftsmanshipSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-zinc-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-light mb-8 tracking-wide">FIVE DECADES OF ARTISTRY</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
          Since 1975, Jové has been transforming precious metals and gemstones into personal narratives.
          Now you can design your perfect piece online with the same attention to detail and craftsmanship.
        </p>
        <p className="text-base text-gray-500 mb-12 max-w-2xl mx-auto">
          From our digital design studio to your doorstep, we create custom bracelets, necklaces, and earrings
          that capture the essence of what matters most to you.
        </p>

        {/* Featured craftsmanship highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-zinc-100 group hover:shadow-md transition-shadow">
            <div className="text-4xl font-light text-zinc-800 mb-2">50+</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider mb-2">Years of Excellence</div>
            <div className="text-xs text-gray-500">Master craftsmanship in every piece</div>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-sm border border-zinc-100 group hover:shadow-md transition-shadow">
            <div className="text-4xl font-light text-zinc-800 mb-2">∞</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider mb-2">Design Possibilities</div>
            <div className="text-xs text-gray-500">Unlimited customization options</div>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-sm border border-zinc-100 group hover:shadow-md transition-shadow">
            <div className="text-4xl font-light text-zinc-800 mb-2">24/7</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider mb-2">Online Design Studio</div>
            <div className="text-xs text-gray-500">Design anytime, anywhere</div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-16">
          <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-light mb-4">Ready to Start Designing?</h3>
            <p className="text-gray-600 mb-6">Create your perfect bracelet, necklace, or earrings in minutes</p>
            <button className="bg-zinc-900 text-white px-8 py-3 rounded-lg hover:bg-zinc-800 transition-colors font-medium tracking-wide">
              EXPLORE DESIGNS
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
