export default function WorkshopSection() {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 tracking-wide text-zinc-800">About Me</h2>
              <div className="h-px w-16 sm:w-20 md:w-24 bg-gradient-to-r from-zinc-400 via-amber-300 to-transparent mb-6 sm:mb-8" />
            </div>
            
            <div className="space-y-4 sm:space-y-6 text-gray-700 leading-relaxed">
              {/* Mobile: Show condensed version */}
              <div className="block sm:hidden space-y-4">
                <p className="text-sm font-medium text-zinc-800">
                  My name is Joey Germani, and jewelry has been in my life from a young age.
                </p>
                <p className="text-sm">
                  Growing up in a family of jewelers with 35+ years of expertise, I became a certified Diamond Grader in New York. 
                  That vision became Jové — where true luxury meets affordability.
                </p>
              </div>
              
              {/* Tablet and Desktop: Show full story */}
              <div className="hidden sm:block space-y-6">
                <p className="text-base">
                  My name is Joey Germani, and jewelry has been in my life from a young age.
                </p>
                
                <p className="text-base">
                  Growing up in a family of jewelers, I learned the art of craftsmanship at my father's factory, 
                  where he shared over 35 years of expertise in retail and manufacturing. By 18, I was working 
                  full-time in the family business, gaining hands-on knowledge of both jewelry and fashion.
                </p>
                
                <p className="text-base">
                  At 21, I moved to New York and became a certified Diamond Grader, determined to bring my 
                  vision to life. That vision became Jové — a brand where true luxury meets affordability, 
                  offering designs I've been perfecting for years.
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:text-center">
            <div className="relative rounded-lg overflow-hidden shadow-xl group">
              {/* Main Image */}
              <div className="aspect-[4/5] relative">
                <img 
                  src="/images/aboutmeimage.jpeg" 
                  alt="Joey Germani - Founder & Diamond Expert" 
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              
              {/* Content overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-white">
                {/* Quote */}
                <div className="mb-6">
                  <blockquote className="text-lg lg:text-xl font-light leading-relaxed italic relative">
                    <span className="text-amber-300 text-4xl font-serif leading-none absolute -top-2 -left-2">"</span>
                    <span className="ml-6">True luxury meets affordability — offering designs I've been perfecting for years.</span>
                    <span className="text-amber-300 text-4xl font-serif leading-none absolute -bottom-4 -right-2">"</span>
                  </blockquote>
                </div>
                
                {/* Profile section */}
                <div className="space-y-4">
                  {/* Name and title */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium not-italic">Joey Germani</h3>
                    <p className="text-sm text-amber-300 uppercase tracking-wider font-medium">Founder & Diamond Expert</p>
                  </div>
                  
                  {/* Family legacy badge */}
                  <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1">
                    <span className="text-xs text-white/90 tracking-wide font-normal">35+ Years Family Legacy</span>
                  </div>
                </div>
              </div>
              
              {/* GIA Logo - Glassy overlay in top right */}
              <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 lg:p-4 border border-white/30 shadow-lg hover:bg-white/25 transition-all duration-300">
                  <img 
                    src="/images/gia-logo.png" 
                    alt="GIA Certified Diamond Grader" 
                    className="h-8 lg:h-10 w-auto filter drop-shadow-sm"
                  />
                  <div className="text-center mt-2">
                    <p className="text-xs font-semibold text-white">Certified</p>
                    <p className="text-xs text-white/80 uppercase tracking-wider">Diamond Grader</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
