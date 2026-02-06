'use client'

import { Heart } from 'lucide-react'

export default function ValentinesBanner() {
  // Check if Valentine's season (show until Feb 14)
  const now = new Date()
  const isValentinesSeason = now.getMonth() === 1 && now.getDate() <= 14

  if (!isValentinesSeason) return null

  return (
    <div className="bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 text-white py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <Heart className="w-4 h-4 flex-shrink-0" fill="currentColor" />
        <p className="text-sm font-light tracking-wide">
          Order before Feb 10 for guaranteed Valentine&apos;s delivery. 
          <span className="hidden sm:inline"> Complimentary gift wrapping & handwritten note included.</span>
        </p>
        <Heart className="w-4 h-4 flex-shrink-0 hidden sm:block" fill="currentColor" />
      </div>
    </div>
  )
}
