import Hero from '@/components/Hero'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import WorkshopSection from '@/components/WorkshopSection'
import BespokeSection from '@/components/BespokeSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <CraftsmanshipSection />
      <WorkshopSection />
      <BespokeSection />
      <Footer />
    </main>
  )
}
