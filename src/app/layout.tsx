import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import MainLayout from "@/components/MainLayout";
import ClarityInit from "./ClarityInit";
import { RedirectNotification } from "@/components/RedirectNotification";

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
        
        {/* Luxury Skin CSS disabled — paired with luxury-skin.js which is disabled */}
        
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '865852876334331');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=865852876334331&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ClarityInit />
        <ServiceWorkerRegister />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Suspense fallback={null}>
                <RedirectNotification />
              </Suspense>
              <MainLayout>{children}</MainLayout>
              <ToastContainer />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
        {/* Luxury Skin JS disabled — causes HierarchyRequestError by trying to
           reparent <body>/<main> inside its own child (circular appendChild).
           The script was designed for traditional HTML forms, not React components. */}
      </body>
    </html>
  );
}
