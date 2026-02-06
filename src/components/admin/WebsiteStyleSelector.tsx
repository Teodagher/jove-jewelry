'use client'

import { useState, useEffect } from 'react'
import { Palette, Heart, Sparkles, ChevronDown } from 'lucide-react'

type SiteStyle = 'original' | 'valentines'

const STYLES: { id: SiteStyle; name: string; icon: React.ReactNode; emoji: string }[] = [
  { id: 'original', name: 'Original', icon: <Sparkles className="w-4 h-4" />, emoji: '✨' },
  { id: 'valentines', name: "Valentine's", icon: <Heart className="w-4 h-4" />, emoji: '💕' },
]

export default function WebsiteStyleSelector() {
  const [currentStyle, setCurrentStyle] = useState<SiteStyle>('original')
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setCurrentStyle(data.style || 'original'))
      .catch(() => {})
  }, [])

  const handleStyleChange = async (style: SiteStyle) => {
    if (style === currentStyle || saving) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/site-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style })
      })

      if (res.ok) {
        setCurrentStyle(style)
        setIsOpen(false)
        // Refresh frontend to show changes
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating style:', error)
    } finally {
      setSaving(false)
    }
  }

  const currentStyleInfo = STYLES.find(s => s.id === currentStyle) || STYLES[0]

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="flex items-center">
          <Palette className="mr-3 h-5 w-5 text-gray-400" />
          <span>Website Style</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{currentStyleInfo.emoji}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 ml-3 space-y-1">
          {STYLES.map((style) => {
            const isSelected = currentStyle === style.id
            
            return (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                disabled={saving}
                className={`
                  flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200
                  ${isSelected 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                  ${saving ? 'opacity-50' : ''}
                `}
              >
                <span>{style.emoji}</span>
                <span>{style.name}</span>
                {isSelected && <span className="ml-auto text-xs">Active</span>}
              </button>
            )
          })}
          <p className="px-3 py-2 text-xs text-gray-500">
            Changes how the website looks to customers
          </p>
        </div>
      )}
    </div>
  )
}
