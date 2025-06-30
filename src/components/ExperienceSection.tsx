export default function ExperienceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-light mb-16">THE JOVÉ EXPERIENCE</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="group">
            <div className="bg-zinc-50 rounded-lg p-6 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="text-2xl mb-3">🛡️</div>
              <h3 className="text-lg font-medium mb-4">LIFETIME WARRANTY</h3>
              <p className="text-gray-600 text-sm">Every piece comes with our lifetime craftsmanship guarantee for ultimate peace of mind.</p>
            </div>
          </div>
          <div className="group">
            <div className="bg-zinc-50 rounded-lg p-6 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="text-2xl mb-3">🎨</div>
              <h3 className="text-lg font-medium mb-4">DESIGN PREVIEW</h3>
              <p className="text-gray-600 text-sm">See your custom jewelry in 3D before you buy with our advanced visualization tools.</p>
            </div>
          </div>
          <div className="group">
            <div className="bg-zinc-50 rounded-lg p-6 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="text-2xl mb-3">💎</div>
              <h3 className="text-lg font-medium mb-4">PREMIUM MATERIALS</h3>
              <p className="text-gray-600 text-sm">Only the finest metals and ethically sourced gemstones in every creation.</p>
            </div>
          </div>
          <div className="group">
            <div className="bg-zinc-50 rounded-lg p-6 mb-4 group-hover:bg-zinc-100 transition-colors">
              <div className="text-2xl mb-3">🚚</div>
              <h3 className="text-lg font-medium mb-4">FREE WORLDWIDE SHIPPING</h3>
              <p className="text-gray-600 text-sm">Complimentary secure shipping and elegant packaging for every order.</p>
            </div>
          </div>
        </div>

        {/* Additional benefits */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="text-3xl mb-3">↩️</div>
            <h3 className="text-lg font-medium mb-3">30-DAY RETURNS</h3>
            <p className="text-gray-600 text-sm">Not completely satisfied? Return your piece within 30 days for a full refund.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-medium mb-3">24/7 SUPPORT</h3>
            <p className="text-gray-600 text-sm">Our jewelry experts are always available to help with your design questions.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
