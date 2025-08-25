import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jové Jewelry",
  description: "Exquisite handcrafted jewelry with premium gemstones and precious metals. Create your perfect piece with our bespoke customization experience.",
  keywords: ["jewelry", "handcrafted", "gemstones", "custom jewelry", "luxury jewelry", "precious metals", "bespoke jewelry"],
  authors: [{ name: "Jové Jewelry" }],
  creator: "Jové Jewelry",
  publisher: "Jové Jewelry",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://maisonjove.com'),
  openGraph: {
    title: "Jové Jewelry",
    description: "Exquisite handcrafted jewelry with premium gemstones and precious metals. Create your perfect piece with our bespoke customization experience.",
    url: 'https://maisonjove.com',
    siteName: 'Jové Jewelry',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jové Jewelry',
    description: 'Exquisite handcrafted jewelry with premium gemstones and precious metals.',
    creator: '@jove_jewelry',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code when needed
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Preconnect to Supabase storage for faster image loading */}
        <link rel="preconnect" href="https://ndqxwvascqwhqaoqkpng.supabase.co" />
        <link rel="dns-prefetch" href="https://ndqxwvascqwhqaoqkpng.supabase.co" />
        
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ServiceWorkerRegister />
        <ToastProvider>
          <CartProvider>
            <ClientBody>{children}</ClientBody>
            <ToastContainer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
