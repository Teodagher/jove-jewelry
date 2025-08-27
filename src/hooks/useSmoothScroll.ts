'use client'

import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export const useSmoothScroll = () => {
  const router = useRouter()
  const pathname = usePathname()

  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
    
    // If we're not on the home page or element doesn't exist, navigate to home first
    if (pathname !== '/' || !element) {
      router.push(`/#${elementId}`)
      return
    }

    // We're on home page and element exists - smooth scroll
    if (element) {
      const yOffset = -100 // Offset for sticky header + some breathing room
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

      // Add a subtle loading effect
      document.body.style.scrollBehavior = 'smooth'
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      })

      // Clean up after scroll
      setTimeout(() => {
        document.body.style.scrollBehavior = 'auto'
      }, 1000)
    }
  }, [router, pathname])

  return { scrollToElement }
}