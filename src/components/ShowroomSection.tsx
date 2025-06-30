import { Button } from '@/components/ui/button'

export default function ShowroomSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-light mb-8 tracking-wide">EXPERIENCE THE ATELIER</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Step into our Adelaide showroom, where elegance meets artistry. Discover our collections, meet our craftspeople,
              and experience the magic of jewelry creation in an intimate, welcoming space.
            </p>
            <p className="text-base text-gray-600 mb-8">
              Our showroom is more than a gallery—it's where stories begin. Touch the textures, see the light dance through
              gemstones, and let our experts guide you to the perfect piece for your story.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full mt-2" />
                <div>
                  <span className="font-medium text-gray-800">Private consultations</span>
                  <p className="text-sm text-gray-600">One-on-one sessions with our design experts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full mt-2" />
                <div>
                  <span className="font-medium text-gray-800">Workshop tours</span>
                  <p className="text-sm text-gray-600">See our artisans at work creating masterpieces</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full mt-2" />
                <div>
                  <span className="font-medium text-gray-800">Complimentary services</span>
                  <p className="text-sm text-gray-600">Cleaning, sizing, and care consultations</p>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="bg-zinc-900 text-white hover:bg-zinc-800 px-8 py-3 text-base tracking-wider"
            >
              BOOK YOUR VISIT
            </Button>
          </div>

          <div className="lg:pl-8">
            <div className="bg-zinc-50 p-8 rounded-lg">
              <h3 className="text-xl font-medium mb-6 tracking-wide">VISIT HOURS</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Saturday</span>
                  <span className="text-gray-600">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sunday</span>
                  <span className="text-gray-600">By appointment</span>
                </div>
              </div>
              <hr className="my-6 border-zinc-200" />
              <div>
                <h4 className="font-medium text-gray-800 mb-2">LOCATION</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  40 North East Road<br />
                  Walkerville, South Australia 5081<br />
                  <span className="text-zinc-800">+61 8 8344 7722</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
