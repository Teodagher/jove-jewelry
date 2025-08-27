'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ScrollToHashOnLoad() {
  const router = useRouter()

  useEffect(() => {
    // Handle hash navigation on page load
    const handleHashScroll = () => {
      const hash = window.location.hash.slice(1) // Remove the #
      if (hash) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            const yOffset = -100 // Offset for sticky header + breathing room
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

            window.scrollTo({
              top: y,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    }

    // Handle initial load
    handleHashScroll()

    // Handle hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashScroll)
    
    return () => {
      window.removeEventListener('hashchange', handleHashScroll)
    }
  }, [])

  return null
}