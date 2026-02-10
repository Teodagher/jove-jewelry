import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export const metadata: Metadata = {
  title: 'Jové Launch Event - Guest Registration',
  description: 'Register for the exclusive Jové jewelry launch event',
};

export default function LaunchEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="launch-event-layout">
      {children}
    </div>
  );
}
