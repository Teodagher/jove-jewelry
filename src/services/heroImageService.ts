import { supabase } from '@/lib/supabase/client'

export type Theme = 'original' | 'valentines';

/**
 * Fetches the current active theme from site_settings
 */
export async function fetchCurrentTheme(): Promise<Theme> {
  try {
    const response = await fetch('/api/admin/site-style');
    if (response.ok) {
      const data = await response.json();
      if (data.style && ['original', 'valentines'].includes(data.style)) {
        return data.style as Theme;
      }
    }
  } catch (e) {
    console.error('Error fetching theme:', e);
  }
  return 'original';
}

/**
 * Fetches all images from the hero-pictures bucket for a specific theme
 */
export async function fetchHeroImages(theme?: Theme): Promise<string[]> {
  try {
    // Use provided theme or fetch current theme
    const activeTheme = theme || await fetchCurrentTheme();
    const folderPath = `hero-pictures/${activeTheme}`;
    
    // First check if the bucket and folder exist
    const { data, error } = await supabase.storage
      .from('website-pictures')
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (error) {
      console.error('Error fetching hero images:', error)
      
      // If folder doesn't exist, try to create it
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log(`Creating ${folderPath} folder...`)
        try {
          // Upload a placeholder file to create the folder
          const { error: uploadError } = await supabase.storage
            .from('website-pictures')
            .upload(`${folderPath}/.keep`, new Blob([''], { type: 'text/plain' }))
          
          if (uploadError) {
            console.error('Error creating folder:', uploadError)
          } else {
            console.log(`${folderPath} folder created successfully`)
          }
        } catch (folderError) {
          console.error(`Error creating ${folderPath} folder:`, folderError)
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
          .getPublicUrl(`${folderPath}/${file.name}`)
        return urlData.publicUrl
      }) || []

    console.log(`Loaded ${imageFiles.length} hero images for ${activeTheme} theme`)
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
export async function fetchHeroImagesProgressive(theme?: Theme): Promise<{
  firstImage: string | null
  allImages: Promise<string[]>
}> {
  try {
    // Use provided theme or fetch current theme
    const activeTheme = theme || await fetchCurrentTheme();
    const folderPath = `hero-pictures/${activeTheme}`;
    
    // Get the image list first
    const { data, error } = await supabase.storage
      .from('website-pictures')
      .list(folderPath, {
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
      .getPublicUrl(`${folderPath}/${firstFile.name}`)
    
    const firstImage = firstUrlData.publicUrl

    // Create promise for all images
    const allImages = Promise.resolve(
      sortedFiles.map(file => {
        const { data: urlData } = supabase.storage
          .from('website-pictures')
          .getPublicUrl(`${folderPath}/${file.name}`)
        return urlData.publicUrl
      })
    )

    console.log(`Loaded first hero image, ${sortedFiles.length} total images for ${activeTheme} theme`)
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
