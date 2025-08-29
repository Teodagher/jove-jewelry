'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProductDescriptionProps {
  productType: string
  customizationState?: { [key: string]: string }
}

interface ProductDescriptionData {
  id: string
  product_type: string
  title: string | null
  description: string | null
  is_active: boolean
}

export default function ProductDescription({ productType, customizationState = {} }: ProductDescriptionProps) {
  const [description, setDescription] = useState<ProductDescriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  // Map jewelry item IDs to product description types
  const getProductDescriptionType = (itemId: string): string => {
    switch (itemId) {
      case 'necklace':
        return 'necklaces'
      case 'ring':
        return 'rings'
      case 'bracelet':
        return 'bracelets'
      case 'earring':
        return 'earrings'
      default:
        return itemId
    }
  }

  // Get stone size text from customization state
  const getStoneSize = (): string => {
    const diamondSize = customizationState.diamond_size
    if (!diamondSize) return '0.15ct' // default fallback
    
    switch (diamondSize) {
      case 'small_015ct':
        return '0.15ct'
      case 'medium_030ct':
        return '0.30ct'
      case 'large_050ct':
        return '0.50ct'
      default:
        return '0.15ct'
    }
  }

  // Replace variables in text with actual values
  const replaceVariables = (text: string): string => {
    const stoneSize = getStoneSize()
    return text.replace(/{selected-stone-size}/g, stoneSize)
  }

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const supabase = createClient()
        const mappedProductType = getProductDescriptionType(productType)
        
        const { data, error } = await supabase
          .from('product_descriptions')
          .select('*')
          .eq('product_type', mappedProductType)
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setDescription(null)
          } else {
            console.error('Error fetching product description:', error)
          }
        } else {
          setDescription(data)
        }
      } catch (err) {
        console.error('Error fetching product description:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDescription()
  }, [productType])

  if (loading) {
    return null
  }

  if (!description || (!description.title && !description.description)) {
    return null
  }

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
      {description.title && (
        <h3 className="text-lg font-medium text-zinc-900 mb-3 text-center">
          {replaceVariables(description.title)}
        </h3>
      )}
      {description.description && (
        <p className="text-sm text-zinc-600 leading-relaxed text-center">
          {replaceVariables(description.description)}
        </p>
      )}
    </div>
  )
}