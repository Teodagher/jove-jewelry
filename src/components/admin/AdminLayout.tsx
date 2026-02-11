'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import logger from '@/lib/logger';
import { Market, MARKET_INFO, ADMIN_MARKETS, setMarketClient, getMarketClient } from '@/lib/market-client';
import WebsiteStyleSelector from './WebsiteStyleSelector';
import {
  Home,
  DollarSign,
  Users,
  Package,
  BarChart3,
  Menu,
  X,
  LogOut,
  Palette,
  UserPlus,
  FileText,
  Settings,
  Gift,
  Tag,
  MessageCircle,
  Images,
  Globe,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Mail,
  Gem
} from 'lucide-react';
import { hasAdminAccess, canAccessPath, getHighestRole, ROLES } from '@/lib/roles';
import AdminInstallPrompt from '../AdminInstallPrompt';
import AdminInstallBanner from '../AdminInstallBanner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { name: 'Product Management', href: '/admin/product-management', icon: Settings },
  { name: 'Preset Designs', href: '/admin/presets', icon: Sparkles },
  {
    name: 'Pricing',
    href: '/admin/pricing',
    icon: DollarSign,
    children: [
      { name: 'Necklaces', href: '/admin/pricing/necklaces' },
      { name: 'Rings', href: '/admin/pricing/rings' },
      { name: 'Bracelets', href: '/admin/pricing/bracelets' },
      { name: 'Earrings', href: '/admin/pricing/earrings' },
    ]
  },
  {
    name: 'Website Customization',
    href: '/admin/website-customization',
    icon: Palette,
    children: [
      { name: 'Pictures', href: '/admin/website-customization/pictures' },
      { name: 'About Us', href: '/admin/website-customization/about' },
    ]
  },
  { name: 'Media Library', href: '/admin/media-library', icon: Images },
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'User Accounts', href: '/admin/users', icon: ShieldCheck },
  {
    name: 'Email',
    href: '/admin/email',
    icon: Mail,
    children: [
      { name: 'Templates', href: '/admin/email' },
      { name: 'Send Email', href: '/admin/email/send' },
    ]
  },
  { name: 'Live Chat', href: '/admin/chat', icon: MessageCircle },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Leads', href: '/admin/leads', icon: UserPlus },
  { name: 'Giveaways', href: '/admin/giveaways', icon: Gift },
  { name: 'Product Descriptions', href: '/admin/descriptions', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  // JOVÉ LAB - Isolated bespoke design admin
  {
    name: 'JOVÉ LAB',
    href: '/admin/jove-lab',
    icon: Gem,
    highlight: true,
    children: [
      { name: 'Templates', href: '/admin/jove-lab/templates' },
      { name: 'Option Library', href: '/admin/jove-lab/options' },
      { name: 'Pricing', href: '/admin/jove-lab/pricing' },
      { name: 'Leads', href: '/admin/jove-lab/leads' },
    ]
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market>('lb');
  const [marketSelectorOpen, setMarketSelectorOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Load saved market on mount
  useEffect(() => {
    const savedMarket = getMarketClient();
    setSelectedMarket(savedMarket);
  }, []);

  // Handle market change
  const handleMarketChange = (market: Market) => {
    setSelectedMarket(market);
    setMarketClient(market);
    // Reload page to apply new market
    window.location.reload();
  };

  logger.log('🏗️ AdminLayout render:', {
    pathname,
    hasUser: !!user,
    userId: user?.id,
    loading
  });

  // Handle auth state with admin role verification
  useEffect(() => {
    const checkAdminRole = async (authUser: typeof user) => {
      if (!authUser) {
        setUser(null);
        setUserRoles([]);
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('roles')
        .eq('auth_user_id', authUser.id)
        .single() as { data: { roles: string[] | null } | null };

      const roles = userData?.roles || [];

      if (hasAdminAccess(roles)) {
        setUser(authUser);
        setUserRoles(roles);
      } else {
        logger.log('⚠️ AdminLayout: User does not have admin access, clearing user');
        setUser(null);
        setUserRoles([]);
      }
      setLoading(false);
    };

    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      logger.log('🏗️ AdminLayout: Initial user check:', { hasUser: !!data.user, userId: data.user?.id });
      checkAdminRole(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.log('🔔 AdminLayout: Auth state changed:', { hasUser: !!session?.user, userId: session?.user?.id });
      checkAdminRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simplified auth handling - let middleware do the heavy lifting
  useEffect(() => {
    if (!loading && pathname === '/admin/login' && user) {
      router.replace('/admin');
    }
    if (!loading && !user && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    logger.log('🏗️ Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 font-light">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/admin/login') {
    return null; // Middleware will handle redirect
  }

  // If on login page, just render children without admin layout
  if (pathname === '/admin/login') {
    logger.log('🏗️ Rendering login page');
    return <>{children}</>;
  }

  logger.log('🏗️ Rendering full admin layout');

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Filter navigation based on user roles
  const filteredNavigation = navigation.filter(item =>
    canAccessPath(userRoles, item.href)
  );

  // Get user's role for display
  const highestRole = getHighestRole(userRoles);
  const roleInfo = highestRole ? ROLES[highestRole] : null;

  const handleSignOut = async () => {
    try {
      logger.log('🏗️ Signing out user');
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      logger.error('❌ Error signing out:', error);
    }
  };



  return (
    <>
      <AdminInstallBanner />
      <div className="h-screen flex overflow-hidden jove-bg-primary">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Fixed Sidebar */}
        <div className={`
        fixed inset-y-0 left-0 z-50 w-64 jove-bg-card shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h1 className="text-xl font-serif font-light text-zinc-900 tracking-wider">JOVÉ</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-600 font-light tracking-[0.2em]">ADMIN</p>
                {roleInfo && highestRole !== 'admin' && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${roleInfo.bgColor} ${roleInfo.color}`}>
                    {roleInfo.displayName}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation - scrollable */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const isHighlight = 'highlight' in item && item.highlight;
              
                return (
                  <div key={item.name}>
                    {/* Divider before highlighted items */}
                    {isHighlight && (
                      <div className="my-4 border-t border-gray-200" />
                    )}
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${active
                          ? isHighlight
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-zinc-100 text-zinc-900'
                          : isHighlight
                            ? 'text-amber-700 hover:bg-amber-50'
                            : 'text-gray-600 jove-bg-accent-hover hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${active 
                          ? isHighlight ? 'text-amber-600' : 'text-zinc-900' 
                          : isHighlight ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `} />
                      {item.name}
                      {isHighlight && (
                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                          Lab
                        </span>
                      )}
                    </Link>

                    {/* Sub-navigation for items with children */}
                    {item.children && (pathname.startsWith('/admin/pricing') || pathname.startsWith('/admin/website-customization') || pathname.startsWith('/admin/email') || pathname.startsWith('/admin/jove-lab')) && pathname.startsWith(item.href) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              block px-3 py-2 text-sm rounded-lg transition-colors duration-200
                              ${pathname === child.href
                                ? 'bg-zinc-50 text-zinc-900 font-medium'
                                : 'text-gray-500 jove-bg-accent-hover hover:text-gray-700'
                              }
                            `}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Website Style Selector */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <WebsiteStyleSelector />
            </div>

            {/* Market Preview Selector */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setMarketSelectorOpen(!marketSelectorOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Globe className="mr-3 h-5 w-5 text-gray-400" />
                  <span>Market Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MARKET_INFO[selectedMarket].flag}</span>
                  <svg className={`w-4 h-4 transition-transform ${marketSelectorOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {marketSelectorOpen && (
                <div className="mt-2 ml-3 space-y-1">
                  {ADMIN_MARKETS.map((market) => {
                    const info = MARKET_INFO[market];
                    const isSelected = selectedMarket === market;

                    return (
                      <button
                        key={market}
                        onClick={() => handleMarketChange(market)}
                        className={`
                        flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200
                        ${isSelected
                            ? 'bg-zinc-900 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                          }
                      `}
                      >
                        <span className="text-lg">{info.flag}</span>
                        <span>{info.name}</span>
                        <span className="text-xs opacity-70">({info.currency})</span>
                      </button>
                    );
                  })}
                  <p className="px-3 py-2 text-xs text-gray-500">
                    Preview site as customer from selected country
                  </p>
                </div>
              )}
            </div>
          </nav>

          {/* Bottom section - fixed */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => {
                // Just redirect to home page without signing out
                window.location.href = '/';
              }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg jove-bg-accent-hover hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go back to website
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg jove-bg-accent-hover hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 jove-bg-card jove-border">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <span className="text-lg font-serif font-light text-zinc-900 tracking-wider">JOVÉ ADMIN</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Main scrollable content */}
          <main className="flex-1 overflow-y-auto jove-bg-primary">
            <div className="py-8">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Admin Install Prompt */}
        <AdminInstallPrompt />
      </div>
    </>
  );
}
