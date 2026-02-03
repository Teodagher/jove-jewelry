import Hero from '@/components/Hero'
import TrustSection from '@/components/TrustSection'
import NaturalDiamondsSection from '@/components/NaturalDiamondsSection'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import BespokeSection from '@/components/BespokeSection'
import OurWorkGallery from '@/components/OurWorkGallery'
import Footer from '@/components/Footer'
import LiveChatWidget from '@/components/LiveChatWidget'
import AdminQuickAccessBar from '@/components/AdminQuickAccessBar'
import ScrollToHashOnLoad from '@/components/ScrollToHashOnLoad'

export default function Home() {
  return (
    <main className="min-h-screen bg-maison-ivory">
      <ScrollToHashOnLoad />
      
      {/* Hero - Full screen cinematic experience */}
      <Hero />
      
      {/* Trust Section - Immediately after hero */}
      <TrustSection />
      
      {/* Bespoke/Customization Section */}
      <BespokeSection />
      
      {/* Our Work Gallery - Infinite scroll */}
      {/* <OurWorkGallery /> */}
      
      {/* Lab-Grown Diamonds Info */}
      <CraftsmanshipSection />
      
      {/* Footer */}
      <Footer />
      
      {/* Live Chat Widget */}
      {/* <LiveChatWidget /> */}
      
      {/* Admin Quick Access Bar (only visible to admins) */}
      <AdminQuickAccessBar />
    </main>
  )
}
