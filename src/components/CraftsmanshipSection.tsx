'use client'

export default function CraftsmanshipSection() {
  return (
    <section className="relative bg-zinc-800 overflow-hidden">
      {/* Main content with prominent image */}
      <div className="relative py-12 sm:py-16 lg:py-20 pb-16 sm:pb-20 lg:pb-24">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-[60vh]">
          {/* Content section - appears first on mobile */}
          <div className="order-1 lg:order-1 flex items-center justify-center p-6 sm:p-8 lg:p-16">
            <div className="max-w-xl w-full space-y-6 lg:space-y-8">
              {/* Title and subtitle moved here */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-wide text-white">
                  Lab-Grown Diamonds
                </h2>
                <div className="h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                <p className="text-lg sm:text-xl text-amber-100 font-light tracking-wide">
                  Redefining Modern Luxury
                </p>
              </div>
              
              <div className="space-y-5 lg:space-y-6 text-gray-300 leading-relaxed">
                <p className="text-base sm:text-lg font-medium text-white">
                  At JOVÉ, we redefine what modern luxury means. Lab-grown diamonds are chemically, physically, and optically identical to natural diamonds.
                </p>
                
                <p className="text-sm sm:text-base text-gray-300">
                  The only difference lies in their origin. While natural diamonds are extracted from the earth, lab-grown diamonds are created through advanced technology that mirrors the exact natural conditions under which diamonds form over billions of years.
                </p>
                
                <p className="text-sm sm:text-base text-gray-300">
                  For aesthetic purposes, lab-grown diamonds often achieve greater clarity and fewer imperfections, ensuring your piece shines at its absolute best.
                </p>
                
                <p className="text-sm sm:text-base font-medium text-amber-100">
                  Best of all, choosing lab-grown means you can experience the luxury of a diamond without compromise—the same timeless elegance and quality, but at a fraction of the cost.
                </p>
              </div>
            </div>
          </div>

          {/* Image section - appears second on mobile */}
          <div className="order-2 lg:order-2 relative min-h-[50vh] lg:min-h-full">
            <div className="absolute inset-0">
              <img 
                src="/images/types-lab-grown-diamonds.jpg" 
                alt="Types of lab-grown diamonds" 
                className="w-full h-full object-cover opacity-80"
              />
              {/* Dark overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/60 via-transparent to-zinc-800/20" />
            </div>
            
            {/* Image caption overlay - responsive positioning */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-lg lg:rounded-xl p-1 sm:p-5 lg:p-6 shadow-2xl border border-white/20">
                <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2">Types & Quality</h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Explore the diverse range of lab-grown diamonds available, from brilliant cuts to fancy shapes, 
                  each offering exceptional quality and unique characteristics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


    </section>
  )
}
