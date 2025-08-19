'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from './Navbar'
import { useCart } from '@/contexts/CartContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const { itemCount } = useCart()

  const jewelryCategories = [
    { name: 'NECKLACES', href: '/customize/necklaces' },
    { name: 'RINGS', href: '/customize/rings' },
    { name: 'BRACELETS', href: '/customize/bracelets' },
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
            <Navbar />

            {/* Right side icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button asChild variant="ghost" size="sm" className="p-2" aria-label="Account">
                <Link href="/auth/login">
                  <User size={20} />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="p-2 relative" aria-label="Cart">
                <Link href="/cart">
                  <div className="relative">
                    <ShoppingCart size={20} />
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white">
            <div className="px-4 py-6 space-y-6">
              {/* Mobile dropdown */}
              <div>
                <button
                  onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                  className="flex items-center justify-between w-full text-left text-lg font-light text-zinc-800 hover:text-zinc-900 py-3 font-serif tracking-wider transition-all duration-300"
                >
                  <span className="text-lg font-light tracking-wider">CUSTOMIZE YOUR</span>
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform duration-300 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                  />
                </button>
                
                {isMobileDropdownOpen && (
                  <div className="mt-2 space-y-0.5 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100">
                    {jewelryCategories.map((category, index) => (
                      <Link
                        key={category.name}
                        href={category.href}
                        className="block text-sm font-light text-zinc-800 hover:text-zinc-900 hover:bg-zinc-100 py-4 px-6 tracking-widest transition-all duration-300"
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsMobileDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center justify-between group">
                          <span>{category.name}</span>
                          <span className="text-zinc-300 group-hover:text-zinc-800 transition-colors duration-300">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile About Us Link */}
              <Link
                href="/about"
                className="block text-lg font-light text-zinc-800 hover:text-zinc-900 py-3 font-serif tracking-wider transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                ABOUT US
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
