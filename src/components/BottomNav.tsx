'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, ShoppingCart, User, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNav() {
    const pathname = usePathname();
    const { itemCount } = useCart();
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Check if app is in standalone mode (installed as PWA)
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

    // Hide/show on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show nav when scrolling up, hide when scrolling down
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
                setShowMoreMenu(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Don't show on admin routes
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    // ONLY show bottom nav when installed as PWA (standalone mode)
    if (!isStandalone) {
        return null;
    }

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname?.startsWith(path);
    };

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/customize', icon: Sparkles, label: 'Customize' },
        { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
        { href: user ? '/account' : '/auth/login', icon: User, label: 'Account' },
    ];

    const moreMenuItems = [
        { href: '/education', label: 'Education' },
        { href: '/#our-work', label: 'Our Work' },
        { href: '/about', label: 'About' },
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <motion.nav
                initial={{ y: 0 }}
                animate={{ y: isVisible ? 0 : 100 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* Backdrop blur effect */}
                <div className="absolute inset-0 bg-maison-ivory/95 backdrop-blur-lg border-t border-maison-warm/50" />

                {/* Navigation items */}
                <div className="relative flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 relative group"
                            >
                                {/* Icon */}
                                <div className="relative">
                                    <Icon
                                        size={22}
                                        strokeWidth={1.5}
                                        className={`transition-colors duration-300 ${active ? 'text-maison-gold' : 'text-maison-charcoal group-hover:text-maison-gold'
                                            }`}
                                    />

                                    {/* Badge for cart */}
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-maison-gold text-maison-black text-[9px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Active indicator dot */}
                                    {active && (
                                        <motion.div
                                            layoutId="activeNavIndicator"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-maison-gold rounded-full"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`text-[10px] mt-1 font-light tracking-wide transition-colors duration-300 ${active ? 'text-maison-gold' : 'text-maison-charcoal/70 group-hover:text-maison-gold'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More button */}
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 relative group"
                    >
                        <Menu
                            size={22}
                            strokeWidth={1.5}
                            className={`transition-colors duration-300 ${showMoreMenu ? 'text-maison-gold' : 'text-maison-charcoal group-hover:text-maison-gold'
                                }`}
                        />
                        <span
                            className={`text-[10px] mt-1 font-light tracking-wide transition-colors duration-300 ${showMoreMenu ? 'text-maison-gold' : 'text-maison-charcoal/70 group-hover:text-maison-gold'
                                }`}
                        >
                            More
                        </span>
                    </button>
                </div>
            </motion.nav>

            {/* More Menu Overlay */}
            <AnimatePresence>
                {showMoreMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMoreMenu(false)}
                            className="fixed inset-0 bg-maison-black/50 backdrop-blur-sm z-40 md:hidden"
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-maison-ivory rounded-t-2xl shadow-2xl md:hidden"
                            style={{
                                paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
                            }}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1 bg-maison-warm rounded-full" />
                            </div>

                            {/* Menu items */}
                            <div className="px-6 py-4 space-y-1">
                                {moreMenuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setShowMoreMenu(false)}
                                        className="block py-4 text-base font-light tracking-wide text-maison-charcoal hover:text-maison-gold transition-colors duration-300 border-b border-maison-warm/30 last:border-0"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
