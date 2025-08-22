import { supabase } from '@/lib/supabase'

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

    // Filter only image files and create public URLs
    const imageFiles = data
      ?.filter(file => {
        // Skip hidden files like .keep
        if (file.name.startsWith('.')) return false
        
        const extension = file.name.toLowerCase().split('.').pop()
        return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '')
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
 * Fallback hero images for when Supabase images are not available
 */
export const fallbackHeroImages: string[] = []
