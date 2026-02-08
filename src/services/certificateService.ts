/**
 * Certificate of Purchase Generation Service
 * Generates luxury PDF certificates for Maison Jové orders
 */

import type { jsPDF as jsPDFType } from 'jspdf'

export interface CertificateData {
  // Customer Details
  customerName: string
  customerEmail: string
  customerPhone?: string
  
  // Order Details
  orderNumber: string
  purchaseDate: string
  
  // Product Details (one certificate per line item)
  productName: string
  productImageUrl?: string
  lineItemIndex: number
  
  // Customization Specifications
  specifications: {
    metalType?: string
    size?: string
    color?: string
    cordColor?: string
    diamondType?: string
    diamondCut?: string
    secondaryStones?: string
    engraving?: string
    [key: string]: string | undefined
  }
}

export interface CertificateResult {
  certificateId: string
  pdfBase64: string
  pngPreviewBase64?: string
}

// Format specification labels nicely
function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    metalType: 'Metal',
    metal: 'Metal',
    size: 'Size',
    color: 'Color',
    cordColor: 'Cord Color',
    cord_color: 'Cord Color',
    diamondType: 'Diamond Type',
    diamond_type: 'Diamond Type',
    diamondCut: 'Diamond Cut',
    diamond_cut: 'Diamond Cut',
    secondaryStones: 'Secondary Stones',
    second_stone: 'Secondary Stone',
    engraving: 'Engraving',
    chain_length: 'Chain Length',
    chainLength: 'Chain Length',
  }
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Format specification values nicely
function formatValue(value: string): string {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Whitegold', 'White Gold')
    .replace('Yellowgold', 'Yellow Gold')
    .replace('Rosegold', 'Rose Gold')
}

// Generate certificate ID: MJ-YYYY-ORDERNUMBER-LINEITEM
function generateCertificateId(orderNumber: string, lineItemIndex: number, purchaseDate: string): string {
  const year = new Date(purchaseDate).getFullYear()
  const orderNum = orderNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return `MJ-${year}-${orderNum}-${lineItemIndex + 1}`
}

export async function generateCertificatePDF(data: CertificateData): Promise<CertificateResult> {
  const certificateId = generateCertificateId(data.orderNumber, data.lineItemIndex, data.purchaseDate)
  
  // Dynamic import jsPDF for server-side compatibility
  const { default: jsPDF } = await import('jspdf')
  
  // Create PDF - A4 portrait (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Colors - Premium neutral tones
  const champagne = '#E8DFD5'
  const stone = '#C9B8A8'
  const warmWhite = '#FAF8F5'
  const darkText = '#1A1A1A'
  const gold = '#C9A96E'
  const mutedText = '#666666'
  
  // Background - warm off-white
  doc.setFillColor(250, 248, 245)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Outer border - subtle champagne
  doc.setDrawColor(232, 223, 213)
  doc.setLineWidth(0.5)
  doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (margin * 2) + 10, 'S')
  
  // Inner border - gold accent
  doc.setDrawColor(201, 169, 110)
  doc.setLineWidth(0.3)
  doc.rect(margin, margin, contentWidth, pageHeight - (margin * 2), 'S')
  
  let yPos = margin + 15
  
  // Header - MAISON JOVÉ
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(28)
  doc.setTextColor(26, 26, 26)
  doc.text('MAISON JOVÉ', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  
  // Gold divider line
  doc.setDrawColor(201, 169, 110)
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 20, yPos, pageWidth / 2 + 20, yPos)
  
  yPos += 15
  
  // Title - Certificate of Purchase
  doc.setFontSize(20)
  doc.setTextColor(26, 26, 26)
  doc.text('Certificate of Purchase', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 25
  
  // Product image placeholder area
  const imageBoxSize = 80
  const imageX = pageWidth / 2 - imageBoxSize / 2
  
  // Image container with border
  doc.setFillColor(245, 243, 240)
  doc.setDrawColor(232, 223, 213)
  doc.setLineWidth(0.3)
  doc.roundedRect(imageX, yPos, imageBoxSize, imageBoxSize, 4, 4, 'FD')
  
  // If we have an image URL, we'll note it (actual image embedding would need async fetch)
  if (data.productImageUrl) {
    // For now, add placeholder text - in production, use addImage with fetched data
    doc.setFontSize(10)
    doc.setTextColor(153, 153, 153)
    doc.text('[Product Image]', pageWidth / 2, yPos + imageBoxSize / 2, { align: 'center' })
  } else {
    // Diamond icon placeholder
    doc.setFontSize(32)
    doc.setTextColor(204, 204, 204)
    doc.text('◆', pageWidth / 2, yPos + imageBoxSize / 2 + 8, { align: 'center' })
  }
  
  yPos += imageBoxSize + 15
  
  // Product name
  doc.setFontSize(16)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text(data.productName, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 20
  
  // Specifications section
  doc.setDrawColor(232, 223, 213)
  doc.setLineWidth(0.2)
  doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
  
  yPos += 10
  
  // Specifications header
  doc.setFontSize(11)
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  doc.text('SPECIFICATIONS', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  
  // Specification items - two columns
  const specs = Object.entries(data.specifications)
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value as string)
    }))
  
  doc.setFontSize(10)
  const specLineHeight = 8
  const colWidth = contentWidth / 2 - 10
  
  specs.forEach((spec, index) => {
    const isLeftCol = index % 2 === 0
    const x = isLeftCol ? margin + 15 : margin + colWidth + 25
    const row = Math.floor(index / 2)
    const y = yPos + row * specLineHeight
    
    // Label
    doc.setTextColor(102, 102, 102)
    doc.setFont('helvetica', 'normal')
    doc.text(`${spec.label}:`, x, y)
    
    // Value
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'bold')
    doc.text(spec.value, x + 40, y)
  })
  
  yPos += Math.ceil(specs.length / 2) * specLineHeight + 15
  
  // Divider
  doc.setDrawColor(232, 223, 213)
  doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
  
  yPos += 15
  
  // Order details section
  doc.setFontSize(10)
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  
  // Order number
  doc.text('Order Number:', margin + 15, yPos)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text(data.orderNumber, margin + 55, yPos)
  
  // Purchase date
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  doc.text('Purchase Date:', pageWidth / 2 + 10, yPos)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  const formattedDate = new Date(data.purchaseDate).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  doc.text(formattedDate, pageWidth / 2 + 50, yPos)
  
  yPos += 12
  
  // Customer name
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  doc.text('Purchased by:', margin + 15, yPos)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text(data.customerName, margin + 50, yPos)
  
  yPos += 20
  
  // Certificate ID
  doc.setFontSize(9)
  doc.setTextColor(153, 153, 153)
  doc.setFont('helvetica', 'normal')
  doc.text(`Certificate ID: ${certificateId}`, pageWidth / 2, yPos, { align: 'center' })
  
  // Footer section - position from bottom
  const footerY = pageHeight - margin - 30
  
  // Signature line
  doc.setDrawColor(201, 169, 110)
  doc.setLineWidth(0.3)
  doc.line(pageWidth / 2 - 35, footerY, pageWidth / 2 + 35, footerY)
  
  // Signature text
  doc.setFontSize(11)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text('Joey Germani', pageWidth / 2, footerY + 8, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'italic')
  doc.text('Founder · Maison Jové', pageWidth / 2, footerY + 14, { align: 'center' })
  
  // Bottom branding
  doc.setFontSize(8)
  doc.setTextColor(153, 153, 153)
  doc.setFont('helvetica', 'normal')
  doc.text('maisonjove.com.au', pageWidth / 2, pageHeight - margin - 5, { align: 'center' })
  
  // Generate base64 PDF
  const pdfBase64 = doc.output('datauristring').split(',')[1]
  
  return {
    certificateId,
    pdfBase64,
  }
}

// Parse customization_data into specifications
export function parseCustomizationToSpecs(customizationData: Record<string, unknown>): CertificateData['specifications'] {
  const specs: CertificateData['specifications'] = {}
  
  // Map known fields
  if (customizationData.metal) specs.metalType = String(customizationData.metal)
  if (customizationData.size) specs.size = String(customizationData.size)
  if (customizationData.color) specs.color = String(customizationData.color)
  if (customizationData.cord_color) specs.cordColor = String(customizationData.cord_color)
  if (customizationData.diamond_type) specs.diamondType = String(customizationData.diamond_type)
  if (customizationData.diamond_cut) specs.diamondCut = String(customizationData.diamond_cut)
  if (customizationData.second_stone) specs.secondaryStones = String(customizationData.second_stone)
  if (customizationData.engraving) specs.engraving = String(customizationData.engraving)
  if (customizationData.chain_length) specs.chainLength = String(customizationData.chain_length)
  
  return specs
}
