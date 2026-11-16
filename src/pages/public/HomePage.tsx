// src/pages/public/HomePage.tsx — Vanessa Tourisme
import { FeaturedSites } from '@/components/home/FeaturedSites'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { VanessaTeaser } from '@/components/home/VanessaTeaser'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedSites />
      <HowItWorks />
      <VanessaTeaser />
    </>
  )
}