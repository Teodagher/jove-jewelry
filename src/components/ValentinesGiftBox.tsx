'use client'

import { Gift, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ValentinesGiftBoxProps {
  variant?: 'product' | 'checkout'
}

export default function ValentinesGiftBox({ variant = 'product' }: ValentinesGiftBoxProps) {
  const [siteStyle, setSiteStyle] = useState<string>('original')
  
  useEffect(() => {
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setSiteStyle(data.style || 'original'))
      .catch(() => setSiteStyle('original'))
  }, [])

  // Only show if Valentine's style is active
  if (siteStyle !== 'valentines') return null

  if (variant === 'checkout') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
        <Gift className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-maison-charcoal font-medium">
            Valentine&apos;s Gift Ready
          </p>
          <p className="text-sm text-maison-graphite">
            Your piece will be wrapped in our Valentine&apos;s packaging, ready to be gifted.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
          <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
        </div>
        <div>
          <p className="text-sm font-medium text-maison-charcoal mb-1">
            Valentine&apos;s Gift Packaging
          </p>
          <p className="text-sm text-maison-graphite">
            This piece arrives in our Valentine&apos;s gift packaging, with the option to include a handwritten note.
          </p>
        </div>
      </div>
    </div>
  )
}
