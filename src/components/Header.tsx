'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'BRACELETS', href: '#' },
    { name: 'NECKLACES', href: '#' },
    { name: 'EARRINGS', href: '#' },
    { name: 'DESIGN STUDIO', href: '#' },
    { name: 'COLLECTIONS', href: '#' },
    { name: 'ABOUT', href: '#' },
    { name: 'CONTACT', href: '#' },
  ]

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-zinc-800 text-zinc-100 text-center py-2 text-sm">
        Free worldwide shipping on all custom jewelry - <span className="underline cursor-pointer">Design Yours Today</span>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-serif text-2xl font-light text-zinc-900 tracking-wider">
                JOVÉ
              </Link>
              <div className="text-xs text-zinc-600 font-light tracking-[0.2em] mt-0.5">
                CUSTOM JEWELRY
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <User size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Search size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white">
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-base font-medium text-zinc-700 hover:text-zinc-900"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
