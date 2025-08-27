"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isAdminRoute = pathname?.startsWith('/admin');

  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
    setMounted(true);
  }, []);

  // Don't render Header until component is mounted to avoid useCart issues
  if (!mounted) {
    return (
      <div className="antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="antialiased">
      {!isAdminRoute && <Header />}
      {children}
    </div>
  );
}
