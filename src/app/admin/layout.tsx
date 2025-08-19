import AdminLayout from '@/components/admin/AdminLayout'

interface AdminRootLayoutProps {
  children: React.ReactNode
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  // Middleware handles all authentication - just render the layout
  return <AdminLayout>{children}</AdminLayout>
}
