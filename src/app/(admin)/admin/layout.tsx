import AdminLayout from '@/components/admin/AdminLayout'
import type { Metadata, Viewport } from 'next'

interface AdminRootLayoutProps {
  children: React.ReactNode
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'Admin Dashboard - Maison Jové',
  description: 'Admin dashboard for Maison Jové jewelry management',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jové Admin',
  },
  icons: {
    icon: '/admin-icon.png',
    apple: '/icons/admin-apple-touch-icon.png',
  },
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>
}
