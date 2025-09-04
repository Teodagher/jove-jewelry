'use client'

export default function NaturalDiamondsSection() {
  return (
    <section className="relative bg-stone-50 overflow-hidden">
      {/* Main content with prominent image */}
      <div className="relative">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:min-h-[80vh]">
          {/* Image section - appears second on mobile, left on desktop */}
          <div className="order-2 lg:order-1 relative h-[40vh] sm:h-[50vh] lg:min-h-full">
            <img 
              src="https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/website-pictures/Other/natural-diamonds.webp" 
              alt="Natural diamonds from the earth" 
              className="w-full h-full object-cover"
            />
            
            {/* Image caption overlay - hide on mobile for cleaner look */}
            <div className="hidden sm:block absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6 shadow-2xl border border-white/20">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-white mb-1 sm:mb-2">Billions of Years</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  Each natural diamond is a unique masterpiece formed deep within the Earth over billions of years, 
                  carrying the essence of time and natural wonder.
                </p>
              </div>
            </div>
          </div>

          {/* Content section - appears first on mobile, right on desktop */}
          <div className="order-1 lg:order-2 flex items-center justify-center px-4 py-6 sm:p-6 md:p-8 lg:p-16">
            <div className="max-w-lg w-full space-y-4 sm:space-y-5 lg:space-y-8">
              {/* Title and subtitle optimized for mobile */}
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 text-center lg:text-left">
                <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extralight tracking-wide text-zinc-800 leading-tight">
                  Natural Diamonds
                </h2>
                <div className="h-px w-16 sm:w-20 lg:w-32 bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto lg:mx-0" />
                <p className="text-sm sm:text-base lg:text-xl text-amber-600 font-light tracking-wide">
                  Timeless Beauty from the Earth
                </p>
              </div>
              
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 text-gray-700 leading-relaxed text-center lg:text-left">
                {/* Main content - optimized for mobile */}
                <p className="text-sm sm:text-base lg:text-lg font-medium text-zinc-800 leading-relaxed">
                  At JOVÉ, we celebrate the rare wonder of nature. Natural diamonds are formed deep within the Earth over billions of years, each one a unique masterpiece of time and pressure.
                </p>
                
                {/* Secondary content */}
                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-relaxed">
                  They embody the essence of tradition, rarity, and eternal elegance making them the ultimate symbol of luxury and love.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
