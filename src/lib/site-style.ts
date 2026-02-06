import { cookies } from 'next/headers'

export type SiteStyle = 'original' | 'valentines'

// Server-side: Get site style from API
export async function getSiteStyle(): Promise<SiteStyle> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maisonjove.com'
    const res = await fetch(`${baseUrl}/api/admin/site-style`, {
      cache: 'no-store' // Always get fresh value
    })
    
    if (res.ok) {
      const data = await res.json()
      return data.style || 'original'
    }
  } catch (error) {
    console.error('Error fetching site style:', error)
  }
  
  return 'original'
}

// Client-side hook for components
export function useSiteStyle() {
  // This will be implemented as a React hook
  // For now, components check the style themselves
}
