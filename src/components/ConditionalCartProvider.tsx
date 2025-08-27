'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CartProvider } from '@/contexts/CartContext'

interface ConditionalCartProviderProps {
  children: React.ReactNode
}

export default function ConditionalCartProvider({ children }: ConditionalCartProviderProps) {
  const pathname = usePathname()
  const [shouldLoadCart, setShouldLoadCart] = useState<boolean | null>(null)
  
  useEffect(() => {
    // Determine if we should load cart based on pathname
    const isAdminPage = pathname?.startsWith('/admin') || false
    setShouldLoadCart(!isAdminPage)
  }, [pathname])
  
  // Wait for pathname to be determined
  if (shouldLoadCart === null) {
    return <>{children}</>
  }
  
  // Skip cart loading for admin pages to prevent infinite loops
  if (!shouldLoadCart) {
    return <>{children}</>
  }
  
  // Use cart provider for all other pages
  return <CartProvider>{children}</CartProvider>
}
