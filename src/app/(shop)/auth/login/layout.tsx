interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  // Don't wrap login page with AdminLayout - just render the children directly
  return <>{children}</>;
}
