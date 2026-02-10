import AdminLayout from '@/components/admin/AdminLayout'
import { Metadata } from 'next'

interface AdminRootLayoutProps {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: 'Admin Dashboard - Maison Jové',
  description: 'Admin dashboard for Maison Jové jewelry management',
  manifest: '/admin-manifest.json',
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jové Admin',
  },
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  // AdminLayout component will handle authentication
  return (
    <>
      {/* Admin PWA Meta Tags */}
      <head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jové Admin" />

        {/* Admin Icons */}
        <link rel="icon" href="/admin-icon.png" />
        <link rel="apple-touch-icon" href="/icons/admin-apple-touch-icon.png" />
      </head>
      <AdminLayout>{children}</AdminLayout>
    </>
  )
}
