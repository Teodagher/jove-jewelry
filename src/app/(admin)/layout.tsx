import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import "../mobile.css";
import { Suspense } from "react";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import ClarityInit from "../ClarityInit";
import OfflineIndicator from "@/components/OfflineIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jové Admin",
  description: "Admin dashboard for Maison Jové jewelry management.",
  manifest: "/admin-manifest.json",
  icons: {
    icon: "/admin-icon.png",
    apple: "/icons/admin-apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jové Admin",
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <meta name="theme-color" content="#111827" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jové Admin" />

        {/* Manifest & Icons */}
        <link rel="manifest" href="/admin-manifest.json" />
        <link rel="icon" href="/admin-icon.png" />
        <link rel="apple-touch-icon" href="/icons/admin-apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning className="antialiased bg-gray-900 text-white">
        <ClarityInit />
        <ServiceWorkerRegister />
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              {/* We can add admin-specific global components here */}
            </Suspense>

            {/* Direct children rendering - no MainLayout wrapper */}
            {children}

            <ToastContainer />
            <OfflineIndicator />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
