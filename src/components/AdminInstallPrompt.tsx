'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Only show on admin pages
        if (!window.location.pathname.startsWith('/admin')) {
            return;
        }

        // Check if already installed
        const isInstalled = localStorage.getItem('admin-pwa-installed');
        const isDismissed = localStorage.getItem('admin-install-dismissed');

        if (isInstalled || isDismissed) {
            return;
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt after 3 seconds
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if running in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            localStorage.setItem('admin-pwa-installed', 'true');
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            localStorage.setItem('admin-pwa-installed', 'true');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('admin-install-dismissed', 'true');
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-700"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 pb-8">
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <svg
                                        className="w-8 h-8 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white">
                                        Install Admin App
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Maison Jové Dashboard
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Install the admin dashboard as a standalone app for quick access to:
                            </p>

                            <ul className="space-y-2">
                                {[
                                    'Manage orders & customers',
                                    'Update products & inventory',
                                    'View analytics & reports',
                                    'Work offline with sync',
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg
                                                className="w-3 h-3 text-amber-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={3}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Download size={18} />
                                    Install Now
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-6 py-3 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                                >
                                    Later
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 text-center pt-2">
                                You can always install later from your browser menu
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
