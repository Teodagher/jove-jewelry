'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, X } from 'lucide-react';

export default function AdminInstallBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

        // Check if banner was dismissed
        const dismissed = localStorage.getItem('admin-install-banner-dismissed');

        // Show banner if not installed and not dismissed
        if (!standalone && !dismissed) {
            setShowBanner(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('admin-install-banner-dismissed', 'true');
        setShowBanner(false);
    };

    if (isStandalone || !showBanner) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <Download className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-sm">
                            Install Admin App
                        </p>
                        <p className="text-xs text-amber-50 mt-0.5">
                            Get quick access from your home screen
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/setup-admin"
                        className="bg-white text-amber-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-colors whitespace-nowrap"
                    >
                        Install Now
                    </Link>
                    <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-amber-600 rounded-lg transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
