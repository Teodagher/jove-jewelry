import AdminLayout from '@/components/admin/AdminLayout'

interface AdminRootLayoutProps {
  children: React.ReactNode
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  // AdminLayout component will handle authentication
  return <AdminLayout>{children}</AdminLayout>
}
