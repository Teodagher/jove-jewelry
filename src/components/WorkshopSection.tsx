export default function WorkshopSection() {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-light mb-8 tracking-wide">DESIGN MADE SIMPLE</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Our intuitive online design studio lets you create the perfect piece from the comfort of your home.
              Choose from hundreds of combinations and see your creation come to life in real-time.
            </p>
            <p className="text-base text-gray-600 mb-8">
              From selecting your base metal to choosing gemstones and adding personal engravings,
              every detail is customizable. Preview your design instantly and make changes until it's perfect.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                <span className="text-sm text-gray-600 uppercase tracking-wider">Interactive 3D Preview</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                <span className="text-sm text-gray-600 uppercase tracking-wider">Hundreds of combinations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                <span className="text-sm text-gray-600 uppercase tracking-wider">Personal engraving options</span>
              </div>
            </div>
          </div>
          <div className="lg:text-right">
            <blockquote className="text-2xl font-light text-gray-700 italic mb-4">
              "Design the jewelry of your dreams with just a few clicks."
            </blockquote>
            <cite className="text-sm text-gray-500 not-italic">— Your personalized jewelry awaits</cite>
          </div>
        </div>
      </div>
    </section>
  )
}
