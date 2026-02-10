'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import AdminQuickAccessBar from '@/components/AdminQuickAccessBar';
import BottomNav from '@/components/BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isAdminRoute = pathname?.startsWith('/admin');

  // Wait for the component to mount to avoid hydration issues with cart context
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="antialiased">
      {mounted && !isAdminRoute && (
        <>
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <AdminQuickAccessBar />
        </>
      )}
      {/* Add bottom padding on mobile to account for bottom nav */}
      <div className={!isAdminRoute ? 'pb-20 md:pb-0' : ''}>
        {children}
      </div>
      {mounted && !isAdminRoute && <BottomNav />}
    </div>
  );
}
