'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  UserPlus
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
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
    ]
  },
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Leads', href: '/admin/leads', icon: UserPlus },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication and admin role
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Skip auth check for login page
        if (pathname === '/admin/login') {
          setLoading(false);
          setIsAuthorized(true);
          return;
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          router.replace('/admin/login');
          return;
        }

        // Check admin role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('roles')
          .eq('auth_user_id', session.user.id)
          .single();

        if (!mounted) return;

        if (userError || !userData?.roles?.includes('admin')) {
          router.replace('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          router.replace('/admin/login');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 font-light">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized && pathname !== '/admin/login') {
    return null; // Will redirect
  }

  // If on login page, just render children without admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Middleware handles all authentication - this component just renders

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



  return (
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
            <p className="text-xs text-zinc-600 font-light tracking-[0.2em]">ADMIN</p>
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
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                      ${active 
                        ? 'bg-zinc-100 text-zinc-900' 
                        : 'text-gray-600 jove-bg-accent-hover hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${active ? 'text-zinc-900' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    {item.name}
                  </Link>

                  {/* Sub-navigation for items with children */}
                  {item.children && (pathname.startsWith('/admin/pricing') || pathname.startsWith('/admin/website-customization')) && (
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
    </div>
  );
}
