import { NextRequest, NextResponse } from 'next/server'
import { generateCertificatePDF } from '@/services/certificateService'

export async function GET(request: NextRequest) {
  const testUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item/rings/ring-emerald-yellow_gold.webp'
  
  try {
    const result = await generateCertificatePDF({
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      orderNumber: 'TEST-123',
      purchaseDate: new Date().toISOString(),
      productName: 'Test Ring',
      productImageUrl: testUrl,
      lineItemIndex: 0,
      specifications: {
        metalType: '18kt Yellow Gold',
        firstStone: 'Diamond',
        secondStone: 'Emerald'
      }
    })
    
    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      pdfSize: result.pdfBase64.length,
      message: 'Certificate generated successfully'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack?.slice(0, 500)
    })
  }
}
