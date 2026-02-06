'use client'

import { Heart } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ValentinesBanner() {
  const [siteStyle, setSiteStyle] = useState<string>('original')
  
  useEffect(() => {
    // Fetch current site style
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setSiteStyle(data.style || 'original'))
      .catch(() => setSiteStyle('original'))
  }, [])

  // Only show if Valentine's style is active
  if (siteStyle !== 'valentines') return null

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
