import Header from '@/components/Header'
import Hero from '@/components/Hero'
import CraftsmanshipSection from '@/components/CraftsmanshipSection'
import WorkshopSection from '@/components/WorkshopSection'
import BespokeSection from '@/components/BespokeSection'
import StorySection from '@/components/StorySection'
import ExperienceSection from '@/components/ExperienceSection'
import PressSection from '@/components/PressSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <CraftsmanshipSection />
      <WorkshopSection />
      <BespokeSection />
      <StorySection />
      <ExperienceSection />
      <PressSection />
      <Footer />
    </main>
  )
}
