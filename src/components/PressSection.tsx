export default function PressSection() {
  return (
    <section className="py-20 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-light mb-12 tracking-wide">WHAT OUR CLIENTS SAY</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-stone-50 p-8 rounded-lg shadow-sm border border-amber-100">
            <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed">
              "Jové transformed my vision into reality. The attention to detail and craftsmanship exceeded every expectation.
              My engagement ring is not just beautiful—it tells our love story perfectly."
            </blockquote>
            <cite className="text-sm text-gray-600 not-italic">— Emma & James, Adelaide</cite>
          </div>

          <div className="bg-stone-50 p-8 rounded-lg shadow-sm border border-amber-100">
            <blockquote className="text-lg text-gray-700 italic mb-6 leading-relaxed">"The quality and care in their work is unmatched. Delivery was also very fast""
            </blockquote>
            <cite className="text-sm text-gray-600 not-italic">— Michael Patterson, Melbourne</cite>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <blockquote className="text-2xl font-light text-gray-700 italic mb-6 leading-relaxed">
            "In a world of mass production, Jové stands apart. They create jewelry that becomes part of your story,
            pieces that will be treasured for generations."
          </blockquote>
          <cite className="text-base text-gray-600 not-italic">— Dr. Caroline Hughes, Jewelry Design Historian</cite>
        </div>
      </div>
    </section>
  )
}
