import AdminLoginForm from './AdminLoginForm'

// Prevent SSG to avoid auth client duplication
export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  // Always show login form - let client-side handle auth checks
  return <AdminLoginForm />
}
