export default function StorySection() {
  return (
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-light mb-8 tracking-wide">STORIES WORTH TELLING</h2>
            <blockquote className="text-xl text-gray-700 italic mb-8 leading-relaxed">
              "When I lost my grandmother, I wanted something to keep her memory close. Jové helped me transform her vintage brooch
              into a modern pendant that I wear every day. It's not just jewelry—it's her love, reimagined for my journey."
            </blockquote>
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-800">Sarah Chen</p>
              <p className="text-sm text-gray-600">Heritage Pendant Collection</p>
            </div>
          </div>

          <div className="lg:pl-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-2xl font-light mb-6 tracking-wide">YOUR STORY AWAITS</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Whether it's celebrating a milestone, honoring a memory, or marking a new beginning,
                every piece of jewelry has a story to tell. What's yours?
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-800 mb-1">Engagements</div>
                  <div className="text-gray-600">Love stories in gold</div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-1">Celebrations</div>
                  <div className="text-gray-600">Milestones marked</div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-1">Memorials</div>
                  <div className="text-gray-600">Memories preserved</div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-1">Gifts</div>
                  <div className="text-gray-600">Moments captured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
