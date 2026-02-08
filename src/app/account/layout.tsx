'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Package, Settings } from 'lucide-react';

const accountNav = [
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/settings', label: 'Settings', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center jove-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maison-gold"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen jove-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-maison-charcoal tracking-wider">
            My Account
          </h1>
          <div className="maison-gold-line mt-4" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Sidebar Navigation */}
          <nav className="md:w-48 flex-shrink-0">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {accountNav.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-light tracking-wide transition-all duration-300 whitespace-nowrap ${
                        isActive
                          ? 'text-maison-gold border-b-2 md:border-b-0 md:border-l-2 border-maison-gold bg-maison-cream/50'
                          : 'text-maison-charcoal hover:text-maison-gold hover:bg-maison-cream/30'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
