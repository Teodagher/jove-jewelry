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
    mainStone?: string
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
    diamondType: 'First Stone',
    diamond_type: 'First Stone',
    mainStone: 'First Stone',
    first_stone: 'First Stone',
    diamondCut: 'Cut',
    diamond_cut: 'Cut',
    secondaryStones: 'Second Stone',
    second_stone: 'Second Stone',
    engraving: 'Engraving',
    chain_length: 'Chain Length',
    chainLength: 'Chain Length',
  }
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Size carat mapping - includes both simple names and database values
const sizeCaratMap: Record<string, string> = {
  'small': '0.15ct',
  'medium': '0.30ct',
  'large': '0.50ct',
  'small 015ct': '0.15ct',
  'medium 030ct': '0.30ct',
  'large 050ct': '0.50ct',
  'small onyx 08ct': '0.8ct',
  'extra_large': '0.50ct',
  'extra large': '0.50ct',
}

// Size display name mapping - for formatted output
const sizeDisplayMap: Record<string, string> = {
  'small 015ct': 'Small (0.15ct)',
  'medium 030ct': 'Medium (0.30ct)',
  'large 050ct': 'Large (0.50ct)',
  'small onyx 08ct': 'Small (0.8ct)',
}

// Format metal type with karat prefix
function formatMetal(value: string): string {
  if (!value) return ''
  
  const lower = value.toLowerCase().replace(/_/g, ' ')
  
  // Check if it's already formatted with kt
  if (lower.includes('kt') || lower.includes('karat')) {
    return value.replace(/\b\w/g, c => c.toUpperCase())
  }
  
  // Add 18kt prefix for gold types
  if (lower.includes('white') && lower.includes('gold')) {
    return '18kt White Gold'
  }
  if (lower.includes('yellow') && lower.includes('gold')) {
    return '18kt Yellow Gold'
  }
  if (lower.includes('rose') && lower.includes('gold')) {
    return '18kt Rose Gold'
  }
  if (lower === 'whitegold') {
    return '18kt White Gold'
  }
  if (lower === 'yellowgold') {
    return '18kt Yellow Gold'
  }
  if (lower === 'rosegold') {
    return '18kt Rose Gold'
  }
  if (lower === 'gold') {
    return '18kt Gold'
  }
  
  // For other metals (silver, platinum, etc)
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Format stone names with full descriptive text
function formatStoneName(value: string): string {
  if (!value) return ''
  
  const lower = value.toLowerCase().replace(/_/g, ' ')
  
  // Map common stone abbreviations to full names
  const stoneMap: Record<string, string> = {
    'pink sapphire': 'Lab Grown Pink Sapphire',
    'blue sapphire': 'Lab Grown Blue Sapphire',
    'yellow sapphire': 'Lab Grown Yellow Sapphire',
    'white sapphire': 'Lab Grown White Sapphire',
    'sapphire': 'Lab Grown Sapphire',
    'ruby': 'Lab Grown Ruby',
    'emerald': 'Lab Grown Emerald',
    'diamond': 'Lab Grown Diamond',
    'moissanite': 'Moissanite',
    'cz': 'Cubic Zirconia',
    'cubic zirconia': 'Cubic Zirconia',
    'amethyst': 'Natural Amethyst',
    'topaz': 'Natural Topaz',
    'aquamarine': 'Natural Aquamarine',
    'peridot': 'Natural Peridot',
    'garnet': 'Natural Garnet',
    'citrine': 'Natural Citrine',
    'opal': 'Natural Opal',
    'pearl': 'Freshwater Pearl',
    'morganite': 'Natural Morganite',
    'tanzanite': 'Natural Tanzanite',
  }
  
  // Check if it already has a prefix like "Lab Grown" or "Natural"
  if (lower.startsWith('lab grown') || lower.startsWith('natural') || lower.startsWith('freshwater')) {
    return value.replace(/\b\w/g, c => c.toUpperCase())
  }
  
  // Look for matches in our map
  for (const [key, fullName] of Object.entries(stoneMap)) {
    if (lower.includes(key)) {
      return fullName
    }
  }
  
  // Default: just capitalize
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Format size with carat weight
function formatSize(value: string): string {
  if (!value) return ''
  
  const lower = value.toLowerCase().replace(/_/g, ' ')
  
  // First check if we have a direct display map entry
  if (sizeDisplayMap[lower]) {
    return sizeDisplayMap[lower]
  }
  
  // Otherwise build it from components
  const caratWeight = sizeCaratMap[lower]
  
  // Extract just the size name (Small, Medium, Large)
  let sizeName = 'Small' // default
  if (lower.includes('medium')) sizeName = 'Medium'
  else if (lower.includes('large')) sizeName = 'Large'
  else if (lower.includes('small')) sizeName = 'Small'
  else {
    // Fallback: capitalize the value
    sizeName = value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
  
  if (caratWeight) {
    return `${sizeName} (${caratWeight})`
  }
  
  return sizeName
}

// Format specification values nicely
function formatValue(key: string, value: string): string {
  if (!value) return ''
  
  // Special formatting based on field type
  if (key === 'metalType' || key === 'metal') {
    return formatMetal(value)
  }
  
  if (key === 'size') {
    return formatSize(value)
  }
  
  if (key === 'diamondType' || key === 'diamond_type' || key === 'mainStone' || 
      key === 'secondaryStones' || key === 'second_stone') {
    return formatStoneName(value)
  }
  
  // Default formatting
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Generate certificate ID: MJ-YYYY-ORDERNUMBER-LINEITEM
function generateCertificateId(orderNumber: string, lineItemIndex: number, purchaseDate: string): string {
  const year = new Date(purchaseDate).getFullYear()
  const orderNum = orderNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return `MJ-${year}-${orderNum}-${lineItemIndex + 1}`
}

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ base64: string; format: 'PNG' | 'JPEG' } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }
    
    const contentType = response.headers.get('content-type') || ''
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    
    // Determine format
    let format: 'PNG' | 'JPEG' = 'PNG'
    if (contentType.includes('jpeg') || contentType.includes('jpg') || url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
      format = 'JPEG'
    }
    
    return { base64, format }
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
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
  
  // Product image area
  const imageBoxSize = 80
  const imageX = pageWidth / 2 - imageBoxSize / 2
  
  // Image container with border
  doc.setFillColor(245, 243, 240)
  doc.setDrawColor(232, 223, 213)
  doc.setLineWidth(0.3)
  doc.roundedRect(imageX, yPos, imageBoxSize, imageBoxSize, 4, 4, 'FD')
  
  // Try to fetch and embed the actual product image
  let imageAdded = false
  if (data.productImageUrl) {
    try {
      const imageData = await fetchImageAsBase64(data.productImageUrl)
      if (imageData) {
        // Add padding inside the box
        const imagePadding = 4
        const imageDisplaySize = imageBoxSize - (imagePadding * 2)
        
        doc.addImage(
          `data:image/${imageData.format.toLowerCase()};base64,${imageData.base64}`,
          imageData.format,
          imageX + imagePadding,
          yPos + imagePadding,
          imageDisplaySize,
          imageDisplaySize
        )
        imageAdded = true
      }
    } catch (error) {
      console.error('Error adding image to PDF:', error)
    }
  }
  
  // Fallback if no image
  if (!imageAdded) {
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
      value: formatValue(key, value as string)
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
    doc.text(spec.value, x + 45, y)
  })
  
  yPos += Math.ceil(specs.length / 2) * specLineHeight + 15
  
  // Divider
  doc.setDrawColor(232, 223, 213)
  doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
  
  yPos += 15
  
  // Order details section - FIXED LAYOUT: Order # left, Date right
  doc.setFontSize(10)
  
  // Order number - LEFT SIDE
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  doc.text('Order Number:', margin + 15, yPos)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text(data.orderNumber, margin + 50, yPos)
  
  // Purchase date - RIGHT SIDE (aligned to right margin)
  const formattedDate = new Date(data.purchaseDate).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  doc.setTextColor(102, 102, 102)
  doc.setFont('helvetica', 'normal')
  const dateLabelWidth = doc.getTextWidth('Purchase Date:')
  doc.text('Purchase Date:', pageWidth - margin - 65, yPos)
  doc.setTextColor(26, 26, 26)
  doc.setFont('helvetica', 'bold')
  doc.text(formattedDate, pageWidth - margin - 15, yPos, { align: 'right' })
  
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
  
  // Map known fields - ORDER MATTERS for display
  if (customizationData.metal) specs.metalType = String(customizationData.metal)
  
  // Handle size with carat weight - check diamond_size or black_onyx_stone_size first
  if (customizationData.diamond_size) {
    specs.size = String(customizationData.diamond_size)
  } else if (customizationData.black_onyx_stone_size) {
    specs.size = String(customizationData.black_onyx_stone_size)
  } else if (customizationData.size) {
    specs.size = String(customizationData.size)
  }
  
  // Handle first stone
  if (customizationData.first_stone) {
    specs.mainStone = String(customizationData.first_stone)
  } else if (customizationData.diamond_type) {
    specs.mainStone = String(customizationData.diamond_type)
  }
  
  // Handle second stone
  if (customizationData.second_stone) specs.secondaryStones = String(customizationData.second_stone)
  
  // Other fields
  if (customizationData.diamond_cut) specs.diamondCut = String(customizationData.diamond_cut)
  if (customizationData.color) specs.color = String(customizationData.color)
  if (customizationData.cord_color) specs.cordColor = String(customizationData.cord_color)
  if (customizationData.chain_length) specs.chainLength = String(customizationData.chain_length)
  if (customizationData.engraving) specs.engraving = String(customizationData.engraving)
  
  return specs
}
