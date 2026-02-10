interface SignupLayoutProps {
  children: React.ReactNode;
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  // Don't wrap signup page with AdminLayout - just render the children directly
  return <>{children}</>;
}
