import OurStorySection from '@/components/OurStorySection'
import WorkshopSection from '@/components/WorkshopSection'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-maison-ivory">
      <section id="our-story">
        <OurStorySection />
      </section>
      <section id="about">
        <WorkshopSection />
      </section>
      <Footer />
    </main>
  )
}
