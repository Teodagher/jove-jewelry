import { supabase } from '@/lib/supabase/client'

/**
 * Fetches all images from the hero-pictures bucket
 */
export async function fetchHeroImages(): Promise<string[]> {
  try {
    // First check if the bucket and folder exist
    const { data, error } = await supabase.storage
      .from('website-pictures')
      .list('hero-pictures', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (error) {
      console.error('Error fetching hero images:', error)
      
      // If folder doesn't exist, try to create it
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log('Creating hero-pictures folder...')
        try {
          // Upload a placeholder file to create the folder
          const { error: uploadError } = await supabase.storage
            .from('website-pictures')
            .upload('hero-pictures/.keep', new Blob([''], { type: 'text/plain' }))
          
          if (uploadError) {
            console.error('Error creating folder:', uploadError)
          } else {
            console.log('Hero-pictures folder created successfully')
          }
        } catch (folderError) {
          console.error('Error creating hero-pictures folder:', folderError)
        }
      }
      
      return []
    }

    // Filter only image files, sort by order prefix, and create public URLs
    const imageFiles = data
      ?.filter(file => {
        // Skip hidden files like .keep
        if (file.name.startsWith('.')) return false
        
        const extension = file.name.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '')
      })
      .sort((a, b) => {
        // Sort by order prefix (001-, 002-, etc.) or filename if no prefix
        const aPrefix = a.name.match(/^(\d{3})-/)?.[1] || '999'
        const bPrefix = b.name.match(/^(\d{3})-/)?.[1] || '999'
        return aPrefix.localeCompare(bPrefix)
      })
      .map(file => {
        const { data: urlData } = supabase.storage
          .from('website-pictures')
          .getPublicUrl(`hero-pictures/${file.name}`)
        return urlData.publicUrl
      }) || []

    console.log(`Loaded ${imageFiles.length} hero images`)
    return imageFiles
  } catch (error) {
    console.error('Error in fetchHeroImages:', error)
    return []
  }
}

/**
 * Fetches hero images with progressive loading strategy
 * Returns first image immediately, then remaining images
 */
export async function fetchHeroImagesProgressive(): Promise<{
  firstImage: string | null
  allImages: Promise<string[]>
}> {
  try {
    // Get the image list first
    const { data, error } = await supabase.storage
      .from('website-pictures')
      .list('hero-pictures', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (error || !data) {
      console.error('Error fetching hero images:', error)
      return { firstImage: null, allImages: Promise.resolve([]) }
    }

    // Filter and sort image files
    const sortedFiles = data
      .filter(file => {
        if (file.name.startsWith('.')) return false
        const extension = file.name.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '')
      })
      .sort((a, b) => {
        const aPrefix = a.name.match(/^(\d{3})-/)?.[1] || '999'
        const bPrefix = b.name.match(/^(\d{3})-/)?.[1] || '999'
        return aPrefix.localeCompare(bPrefix)
      })

    if (sortedFiles.length === 0) {
      return { firstImage: null, allImages: Promise.resolve([]) }
    }

    // Get first image URL immediately
    const firstFile = sortedFiles[0]
    const { data: firstUrlData } = supabase.storage
      .from('website-pictures')
      .getPublicUrl(`hero-pictures/${firstFile.name}`)
    
    const firstImage = firstUrlData.publicUrl

    // Create promise for all images
    const allImages = Promise.resolve(
      sortedFiles.map(file => {
        const { data: urlData } = supabase.storage
          .from('website-pictures')
          .getPublicUrl(`hero-pictures/${file.name}`)
        return urlData.publicUrl
      })
    )

    console.log(`Loaded first hero image, ${sortedFiles.length} total images`)
    return { firstImage, allImages }
  } catch (error) {
    console.error('Error in fetchHeroImagesProgressive:', error)
    return { firstImage: null, allImages: Promise.resolve([]) }
  }
}

/**
 * Fallback hero images for when Supabase images are not available
 */
export const fallbackHeroImages: string[] = []
