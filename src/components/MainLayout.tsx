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
  const [isStandalone, setIsStandalone] = useState(false);
  const isAdminRoute = false; // Always false in (shop) route group

  // Wait for the component to mount to avoid hydration issues with cart context
  useEffect(() => {
    setMounted(true);

    // Check if running in standalone mode (PWA)
    const checkStandalone = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode);
    };

    checkStandalone();
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
      {/* Add bottom padding on mobile ONLY when in PWA standalone mode */}
      <div className={!isAdminRoute && isStandalone ? 'pb-24 md:pb-0' : ''}>
        {children}
      </div>
      {mounted && !isAdminRoute && <BottomNav />}
    </div>
  );
}
