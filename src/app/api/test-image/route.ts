import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET(request: NextRequest) {
  const testUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/rings/ring-emerald-yellow_gold.webp'
  
  const results: string[] = []
  
  try {
    results.push('1. Starting fetch...')
    
    const response = await fetch(testUrl, {
      headers: { 'Accept': 'image/*' }
    })
    
    results.push(`2. Fetch response: ${response.status} ${response.statusText}`)
    results.push(`3. Content-Type: ${response.headers.get('content-type')}`)
    
    if (!response.ok) {
      return NextResponse.json({ results, error: 'Fetch failed' })
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    results.push(`4. Buffer size: ${buffer.length} bytes`)
    
    // Test sharp
    results.push('5. Testing sharp...')
    
    try {
      const metadata = await sharp(buffer).metadata()
      results.push(`6. Sharp metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`)
      
      // Try to convert to PNG
      results.push('7. Converting to PNG...')
      const pngBuffer = await sharp(buffer).png().toBuffer()
      results.push(`8. PNG buffer size: ${pngBuffer.length} bytes`)
      
      // Try to crop
      results.push('9. Testing crop...')
      const size = Math.min(metadata.width || 100, metadata.height || 100)
      const croppedBuffer = await sharp(buffer)
        .resize(size, size, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer()
      results.push(`10. Cropped buffer size: ${croppedBuffer.length} bytes`)
      
      return NextResponse.json({ 
        success: true, 
        results,
        base64Preview: pngBuffer.toString('base64').slice(0, 100) + '...'
      })
    } catch (sharpError: any) {
      results.push(`Sharp error: ${sharpError.message}`)
      results.push(`Sharp stack: ${sharpError.stack?.slice(0, 500)}`)
      return NextResponse.json({ results, error: sharpError.message })
    }
  } catch (error: any) {
    results.push(`Error: ${error.message}`)
    return NextResponse.json({ results, error: error.message })
  }
}
