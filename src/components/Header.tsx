'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  show_in_menu?: boolean
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
  const [siteStyle, setSiteStyle] = useState<string>('original')
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Detect email confirmation redirect
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setShowEmailConfirmed(true)
      // Clean the URL without reloading
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router])

  // Check if running in standalone mode (PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode);
    };

    checkStandalone();
  }, []);

  // Fetch site style
  useEffect(() => {
    fetch('/api/admin/site-style')
      .then(res => res.json())
      .then(data => setSiteStyle(data.style || 'original'))
      .catch(() => setSiteStyle('original'))
  }, [])

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
          // Only show categories marked show_in_menu (default true if not set)
          const menuCategories = typedData.filter(c => c.show_in_menu !== false)
          const topLevel = menuCategories.filter(c => !c.parent_id)
          const children = menuCategories.filter(c => c.parent_id)

          // Attach children to their parents
          const categoriesWithChildren = topLevel.map(parent => ({
            ...parent,
            children: children.filter(c => c.parent_id === parent.id)
          }))

          setTopLevelCategories(categoriesWithChildren)
        } else {
          // No parent_id column yet - treat all as top-level without children
          const menuCategories = typedData.filter(c => c.show_in_menu !== false)
          setTopLevelCategories(menuCategories.map(c => ({ ...c, children: [] })))
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
      {/* Valentine's Promo Banner - only when style is active */}
      {siteStyle === 'valentines' && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 text-white text-center py-2 px-4"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <p className="text-xs md:text-sm font-medium tracking-wide">
            ♥ Order before 11 Feb to get it in time for Valentine&apos;s Day ♥
          </p>
        </div>
      )}

      {/* Main header */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-maison-ivory/95 backdrop-blur-md shadow-sm'
          : 'bg-maison-ivory'
          }`}
        style={{
          top: siteStyle === 'valentines' ? 'calc(max(env(safe-area-inset-top), 8px) + 32px)' : '0',
          paddingTop: siteStyle === 'valentines' ? '0' : 'env(safe-area-inset-top)',
        }}
      >
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-maison-gold/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Mobile: Show hamburger menu when NOT in PWA standalone mode */}
            {!isStandalone && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={22} strokeWidth={1} /> : <Menu size={22} strokeWidth={1} />}
              </button>
            )}

            {/* Mobile PWA: Centered logo with spacer (only in standalone mode) */}
            {isStandalone && (
              <div className="flex md:hidden items-center justify-between w-full">
                {/* Spacer for balance */}
                <div className="w-10" />

                {/* Logo - centered */}
                <Link href="/" className="flex flex-col items-center group">
                  <span className="font-serif text-base font-light text-maison-black tracking-[0.2em] transition-colors duration-300 group-hover:text-maison-gold whitespace-nowrap">
                    MAISON JOVÉ
                  </span>
                  <span className="text-[8px] text-maison-graphite/70 font-light tracking-[0.3em]">
                    FINE JEWELLERY
                  </span>
                </Link>

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
            )}

            {/* Logo - Desktop always, Mobile only when NOT in PWA */}
            <Link href="/" className={`${isStandalone ? 'hidden md:flex' : 'flex'} flex-col items-start group`}>
              <span className="font-serif text-lg md:text-xl font-light text-maison-black tracking-[0.2em] transition-colors duration-300 group-hover:text-maison-gold whitespace-nowrap">
                MAISON JOVÉ
              </span>
              <span className="text-[9px] md:text-[10px] text-maison-graphite/70 font-light tracking-[0.3em]">
                FINE JEWELLERY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {/* Jewellery Dropdown - contains all categories */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-sm font-light tracking-wider text-maison-charcoal hover:text-maison-gold transition-colors duration-300 py-2">
                  <span>JEWELLERY</span>
                  <ChevronDown size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="bg-maison-ivory border border-maison-warm shadow-lg min-w-[220px]">
                    <div className="py-2">
                      {/* All Collections link */}
                      <Link
                        href="/customize"
                        className="block px-6 py-3 text-sm font-medium tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300 border-b border-maison-warm/30"
                      >
                        All Collections
                      </Link>
                      {/* Individual categories */}
                      {topLevelCategories.map((category) => {
                        // If it has children, show children; otherwise show the category itself
                        const hasChildren = category.children && category.children.length > 0
                        if (hasChildren) {
                          return category.children!.map((child) => (
                            <Link
                              key={child.id}
                              href={`/customize/category/${child.slug}`}
                              className="block px-6 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                            >
                              {child.name}
                            </Link>
                          ))
                        } else {
                          return (
                            <Link
                              key={category.id}
                              href={`/customize/category/${category.slug}`}
                              className="block px-6 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                            >
                              {category.name}
                            </Link>
                          )
                        }
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Valentine's Edit - Only when Valentine's style is active */}
              {siteStyle === 'valentines' && (
                <Link
                  href="/valentines"
                  className="text-sm font-light tracking-wider text-rose-500 hover:text-rose-600 transition-colors duration-300 flex items-center gap-1"
                >
                  <span>♥</span> VALENTINE&apos;S EDIT
                </Link>
              )}

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

            {/* Right side icons - Desktop only for account, cart visible on both */}
            <div className="hidden md:flex items-center gap-4 md:gap-6">
              {/* Account Icon - Desktop only */}
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
                        <Link
                          href="/account/profile"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="block px-4 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                        >
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setIsAccountMenuOpen(false)}
                          className="block px-4 py-3 text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/50 transition-all duration-300"
                        >
                          My Orders
                        </Link>
                        <div className="h-px bg-maison-warm/50 mx-4 my-1" />
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

              {/* Cart Icon - Desktop */}
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
            className={`fixed left-0 right-0 bg-maison-ivory border-b border-maison-warm z-40 md:hidden overflow-hidden ${siteStyle === 'valentines' ? 'top-[105px]' : 'top-[73px]'
              }`}
          >
            <nav className="px-6 py-8 space-y-6">
              {/* Jewellery dropdown with all categories */}
              <div>
                <button
                  onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="font-serif text-lg font-light tracking-wider text-maison-charcoal">
                    Jewellery
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
                      {/* All Collections */}
                      <Link
                        href="/customize"
                        onClick={() => {
                          setIsMenuOpen(false)
                          setIsMobileDropdownOpen(false)
                        }}
                        className="block text-sm font-medium tracking-wide text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
                      >
                        All Collections
                      </Link>
                      {/* Individual categories */}
                      {topLevelCategories.map((category) => {
                        const hasChildren = category.children && category.children.length > 0
                        if (hasChildren) {
                          return category.children!.map((child) => (
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
                          ))
                        } else {
                          return (
                            <Link
                              key={category.id}
                              href={`/customize/category/${category.slug}`}
                              onClick={() => {
                                setIsMenuOpen(false)
                                setIsMobileDropdownOpen(false)
                              }}
                              className="block text-sm font-light tracking-wide text-maison-graphite hover:text-maison-gold transition-colors duration-300"
                            >
                              {category.name}
                            </Link>
                          )
                        }
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                  <Link
                    href="/account/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-sm font-light tracking-wide text-maison-charcoal hover:text-maison-gold transition-colors duration-300"
                  >
                    My Orders
                  </Link>
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

      {/* Spacer for fixed header (+ banner when Valentine's active) */}
      <div
        className={siteStyle === 'valentines' ? 'h-[104px]' : 'h-16 md:h-20'}
        style={{
          paddingTop: siteStyle === 'valentines' ? 'env(safe-area-inset-top)' : '0'
        }}
      />

      {/* Email Confirmed Modal */}
      <AnimatePresence>
        {showEmailConfirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-maison-black/70 backdrop-blur-sm"
              onClick={() => setShowEmailConfirmed(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="relative w-full max-w-md bg-maison-ivory p-8 md:p-12 shadow-2xl"
            >
              <button
                onClick={() => setShowEmailConfirmed(false)}
                className="absolute top-6 right-6 text-maison-graphite/60 hover:text-maison-black transition-colors duration-300"
              >
                <X size={20} strokeWidth={1} />
              </button>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-maison-gold/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <svg className="w-8 h-8 text-maison-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-maison-black mb-4">
                  Email Verified
                </h2>
                <p className="text-maison-graphite font-light leading-relaxed mb-8">
                  Your email has been successfully verified. You can now log in to your account.
                </p>
                <button
                  onClick={() => {
                    setShowEmailConfirmed(false)
                    openAuthModal('login')
                  }}
                  className="maison-btn-primary w-full"
                >
                  Log In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  )
}
