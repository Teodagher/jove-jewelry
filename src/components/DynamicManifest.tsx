'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DynamicManifest() {
    const pathname = usePathname();

    useEffect(() => {
        // Determine which manifest to use
        const isAdmin = pathname?.startsWith('/admin');
        const manifestPath = isAdmin ? '/admin-manifest.json' : '/manifest.json';

        // Find existing manifest link or create new one
        let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;

        if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            document.head.appendChild(manifestLink);
        }

        // Update manifest href
        if (manifestLink.href !== manifestPath) {
            manifestLink.href = manifestPath;
            console.log('📱 Switched manifest to:', manifestPath);
        }

        // Update theme color for admin
        let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }

        themeColorMeta.content = isAdmin ? '#111827' : '#FAF9F7';

    }, [pathname]);

    return null;
}
