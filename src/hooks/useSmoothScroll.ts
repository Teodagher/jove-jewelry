'use client'

import { useCallback } from 'react'

export const useSmoothScroll = () => {
  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId)
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
  }, [])

  return { scrollToElement }
}