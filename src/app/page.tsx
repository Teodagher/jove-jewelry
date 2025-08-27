import Hero from '@/components/Hero'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import WorkshopSection from '@/components/WorkshopSection'
import BespokeSection from '@/components/BespokeSection'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import ScrollToHashOnLoad from '@/components/ScrollToHashOnLoad'

export default function Home() {
  return (
    <main className="min-h-screen">
      <ScrollToHashOnLoad />
      <Hero />
      <CraftsmanshipSection />
      <WorkshopSection />
      <BespokeSection />
      <Footer />
      
      {/* WhatsApp floating button */}
      <WhatsAppButton phoneNumber="+961 71 777 422" />
    </main>
  )
}
