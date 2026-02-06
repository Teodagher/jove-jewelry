'use client'

import { useState, useEffect } from 'react'
import { Palette, Heart, Sparkles, Check } from 'lucide-react'

type SiteStyle = 'original' | 'valentines'

interface StyleOption {
  id: SiteStyle
  name: string
  description: string
  icon: React.ReactNode
  preview: string
  colors: string[]
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Classic Maison Jové elegance with gold accents',
    icon: <Sparkles className="w-5 h-5" />,
    preview: 'Default hero, standard navigation',
    colors: ['bg-amber-400', 'bg-zinc-900', 'bg-stone-100']
  },
  {
    id: 'valentines',
    name: "Valentine's",
    description: 'Romantic theme with rose accents and love messaging',
    icon: <Heart className="w-5 h-5" />,
    preview: 'Valentine hero, pink banner, gift messaging',
    colors: ['bg-rose-400', 'bg-rose-100', 'bg-pink-50']
  }
]

export default function SiteStyleSelector() {
  const [currentStyle, setCurrentStyle] = useState<SiteStyle>('original')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCurrentStyle()
  }, [])

  const fetchCurrentStyle = async () => {
    try {
      const res = await fetch('/api/admin/site-style')
      const data = await res.json()
      setCurrentStyle(data.style || 'original')
    } catch (error) {
      console.error('Error fetching style:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStyleChange = async (style: SiteStyle) => {
    if (style === currentStyle) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style })
      })

      if (res.ok) {
        setCurrentStyle(style)
        // Show success feedback
        alert(`Website style changed to "${style === 'valentines' ? "Valentine's" : 'Original'}". Refresh the frontend to see changes.`)
      }
    } catch (error) {
      console.error('Error updating style:', error)
      alert('Failed to update style')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Palette className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Website Style</h3>
          <p className="text-sm text-gray-500">Switch between different website themes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STYLE_OPTIONS.map((option) => {
          const isSelected = currentStyle === option.id
          
          return (
            <button
              key={option.id}
              onClick={() => handleStyleChange(option.id)}
              disabled={saving}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon and title */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${option.id === 'valentines' ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600'}
                `}>
                  {option.icon}
                </div>
                <span className="font-medium text-gray-900">{option.name}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>

              {/* Color preview */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Colors:</span>
                {option.colors.map((color, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${color} border border-gray-200`} />
                ))}
              </div>

              {/* Preview text */}
              <p className="text-xs text-gray-400 mt-2">{option.preview}</p>
            </button>
          )
        })}
      </div>

      {/* Current status */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Current style: <span className="font-medium text-gray-900">
            {currentStyle === 'valentines' ? "💕 Valentine's" : '✨ Original'}
          </span>
        </p>
      </div>
    </div>
  )
}
