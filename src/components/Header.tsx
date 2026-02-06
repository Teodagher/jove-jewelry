'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import AuthModal from './AuthModal'

interface ProductCategory {
  id: string
  name: string
  slug: string
  display_order: number
  parent_id?: string | null
  children?: ProductCategory[]
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [topLevelCategories, setTopLevelCategories] = useState<ProductCategory[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch product categories from Supabase and build hierarchy
  useEffect(() => {
    const fetchCategories = async () => {
      // Try to fetch with parent_id, fallback to without if column doesn't exist
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (!error && data) {
        // Cast to our interface
        const typedData = data as ProductCategory[]
        setCategories(typedData)
        
        // Check if parent_id exists in the data
        const hasParentId = typedData.length > 0 && 'parent_id' in typedData[0]
        
        if (hasParentId) {
          // Build hierarchy - top level categories have null/undefined parent_id
          const topLevel = typedData.filter(c => !c.parent_id)
          const children = typedData.filter(c => c.parent_id)
          
          // Attach children to their parents
          const categoriesWithChildren = topLevel.map(parent => ({
            ...parent,
            children: children.filter(c => c.parent_id === parent.id)
          }))
          
          setTopLevelCategories(categoriesWithChildren)
        } else {
          // No parent_id column yet - treat all as top-level without children
          setTopLevelCategories(typedData.map(c => ({ ...c, children: [] })))
        }
      }
    }

    fetchCategories()
  }, [])

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.account-menu-container')) {
        setIsAccountMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
    setIsAccountMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAccountMenuOpen(false)
  }

  // Render desktop nav item - handles both parent categories (with dropdowns) and standalone links
  const renderDesktopNavItem = (category: ProductCategory) => {
    const hasChildren = category.children && category.children.length > 0
    
    if (hasChildren) {
      return (
        <div key={category.id} className="relative group">
          <button className="flex items-center gap-1.5 text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300 py-2">
            <span>{category.name.toUpperCase()}</span>
            <ChevronDown size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-180" />
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            <div className="bg-maison-ivory border border-maison-warm shadow-lg min-w-[200px]">
              <div className="py-2">
                {category.children!.map((child) => (
                  <Link
                    key={child.id}
                    href={`/customize/category/${child.slug}`}
                    className="block px-6 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <Link
          key={category.id}
          href={`/customize/category/${category.slug}`}
          className="text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300 py-2"
        >
          {category.name.toUpperCase()}
        </Link>
      )
    }
  }

  return (
    <>
      {/* Main header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-maison-ivory/95 backdrop-blur-md shadow-sm' 
            : 'bg-maison-ivory'
        }`}
      >
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-maison-gold/40 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 md:h-20">
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} strokeWidth={1} /> : <Menu size={22} strokeWidth={1} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex flex-col items-center group">
              <span className="font-serif text-xl md:text-2xl font-light text-maison-black tracking-[0.15em] transition-colors duration-300 group-hover:text-maison-gold">
                MAISON JOVÉ
              </span>
              <span className="text-[10px] md:text-xs text-maison-graphite/70 font-light tracking-[0.25em] mt-0.5">
                FINE JEWELLERY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {/* Dynamic category nav items */}
              {topLevelCategories.map(renderDesktopNavItem)}

              <Link 
                href="/customize" 
                className="text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                CUSTOMISE
              </Link>

              <Link
                href="/education"
                className="text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                EDUCATION
              </Link>

              <Link 
                href="/#our-work" 
                className="text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                OUR WORK
              </Link>

              <Link
                href="/about"
                className="text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                ABOUT
              </Link>
            </nav>

            {/* Right side icons */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Account Icon */}
              <div className="relative account-menu-container">
                <button
                  onClick={() => user ? setIsAccountMenuOpen(!isAccountMenuOpen) : openAuthModal('login')}
                  className="p-2 text-maison-charcoal hover:text-maison-gold transition-colors duration-300 relative"
                  aria-label="Account"
                >
                  <User size={20} strokeWidth={1.5} />
                  {user && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 bg-maison-gold rounded-full" />
                  )}
                </button>

                {/* Account Dropdown (when logged in) */}
                <AnimatePresence>
                  {isAccountMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 bg-maison-ivory border border-maison-warm shadow-lg min-w-[200px] z-50"
                    >
                      <div className="p-4 border-b border-maison-warm/50">
                        <p className="text-xs text-maison-graphite/60 uppercase tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm text-maison-charcoal font-light truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Icon */}
              <Link 
                href="/cart" 
                className="p-2 text-maison-charcoal hover:text-maison-gold transition-colors duration-300 relative"
                aria-label="Cart"
              >
                <ShoppingCart size={20} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-maison-gold text-maison-black text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-px bg-maison-warm/50" />
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[73px] left-0 right-0 bg-maison-ivory border-b border-maison-warm z-40 md:hidden overflow-hidden"
          >
            <nav className="px-6 py-8 space-y-6">
              {/* Dynamic Categories - renders parent categories with expandable children */}
              {topLevelCategories.map((category) => {
                const hasChildren = category.children && category.children.length > 0
                
                if (hasChildren) {
                  return (
                    <div key={category.id}>
                      <button
                        onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <span className="font-serif text-lg font-light tracking-wider text-maison-charcoal">
                          {category.name}
                        </span>
                        <ChevronDown 
                          size={18} 
                          strokeWidth={1.5}
                          className={`text-maison-graphite transition-transform duration-300 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isMobileDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 ml-4 space-y-3 overflow-hidden"
                          >
                            {category.children!.map((child) => (
                              <Link
                                key={child.id}
                                href={`/customize/category/${child.slug}`}
                                onClick={() => {
                                  setIsMenuOpen(false)
                                  setIsMobileDropdownOpen(false)
                                }}
                                className="block text-sm font-light tracking-wide text-maison-graphite hover:text-maison-gold transition-colors duration-300"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                } else {
                  return (
                    <Link
                      key={category.id}
                      href={`/customize/category/${category.slug}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block font-serif text-lg font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
                    >
                      {category.name}
                    </Link>
                  )
                }
              })}

              <div className="h-px bg-maison-warm/50" />

              <Link
                href="/customize"
                onClick={() => setIsMenuOpen(false)}
                className="block font-serif text-lg font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                Customise
              </Link>

              <Link
                href="/education"
                onClick={() => setIsMenuOpen(false)}
                className="block font-serif text-lg font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                Education
              </Link>

              <Link
                href="/#our-work"
                onClick={() => setIsMenuOpen(false)}
                className="block font-serif text-lg font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                Our Work
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="block font-serif text-lg font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
              >
                About
              </Link>

              <div className="h-px bg-maison-warm/50" />

              {/* Mobile Account Section */}
              {user ? (
                <div className="space-y-3">
                  <p className="text-xs text-maison-graphite/60 uppercase tracking-wider">Account</p>
                  <p className="text-sm text-maison-charcoal font-light">{user.email}</p>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="text-sm font-light tracking-wide text-maison-gold"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      openAuthModal('login')
                    }}
                    className="flex-1 py-3 text-sm font-light tracking-wider text-maison-charcoal border border-maison-charcoal hover:bg-maison-charcoal hover:text-maison-ivory transition-all duration-300"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      openAuthModal('signup')
                    }}
                    className="flex-1 py-3 text-sm font-light tracking-wider bg-maison-black text-maison-ivory hover:bg-maison-charcoal transition-all duration-300"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-18 md:h-20" />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  )
}
