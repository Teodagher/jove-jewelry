import Hero from '@/components/Hero'
import ValentinesHero from '@/components/ValentinesHero'
import TrustSection from '@/components/TrustSection'
import NaturalDiamondsSection from '@/components/NaturalDiamondsSection'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import BespokeSection from '@/components/BespokeSection'
import OurWorkGallery from '@/components/OurWorkGallery'
import Footer from '@/components/Footer'
import LiveChatWidget from '@/components/LiveChatWidget'
import AdminQuickAccessBar from '@/components/AdminQuickAccessBar'
import ScrollToHashOnLoad from '@/components/ScrollToHashOnLoad'
import { createClient } from '@supabase/supabase-js'

// Disable caching so style changes take effect immediately
export const revalidate = 0
export const dynamic = 'force-dynamic'

// Fetch site style from database
async function getSiteStyle(): Promise<'original' | 'valentines'> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_style')
      .single()
    
    return (data?.value as 'original' | 'valentines') || 'original'
  } catch {
    return 'original'
  }
}

export default async function Home() {
  const siteStyle = await getSiteStyle()
  const isValentines = siteStyle === 'valentines'
  
  return (
    <main className="min-h-screen bg-maison-ivory">
      <ScrollToHashOnLoad />
      
      {/* Hero - Full screen cinematic experience */}
      {isValentines ? <ValentinesHero /> : <Hero />}
      
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
