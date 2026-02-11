'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isInStandaloneMode);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Check if prompt was dismissed
        const promptDismissed = localStorage.getItem('installPromptDismissed');
        const dismissedTime = promptDismissed ? parseInt(promptDismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Don't show if already installed or dismissed within last 7 days
        if (isInStandaloneMode || daysSinceDismissed < 7) {
            return;
        }

        // Listen for beforeinstallprompt event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show manual instructions after delay
        if (iOS && !isInStandaloneMode && daysSinceDismissed >= 7) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    };

    // Don't show if already installed
    if (isStandalone) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50"
                >
                    <div className="bg-maison-ivory border border-maison-warm shadow-2xl rounded-lg overflow-hidden">
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 text-maison-graphite/60 hover:text-maison-black transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={18} strokeWidth={1.5} />
                        </button>

                        <div className="p-6">
                            {/* Icon */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-maison-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Download size={24} strokeWidth={1.5} className="text-maison-gold" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg font-light text-maison-black">
                                        Install Maison Jové
                                    </h3>
                                    <p className="text-xs text-maison-graphite/70 font-light">
                                        Get the app experience
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-maison-graphite/80 font-light mb-4 leading-relaxed">
                                Install our app for a faster, more convenient shopping experience. Access your favorites and orders anytime.
                            </p>

                            {/* iOS Instructions */}
                            {isIOS && (
                                <div className="bg-maison-cream/50 rounded p-3 mb-4">
                                    <p className="text-xs text-maison-charcoal font-light leading-relaxed">
                                        Tap the <strong>Share</strong> button in Safari, then select <strong>"Add to Home Screen"</strong>
                                    </p>
                                </div>
                            )}

                            {/* Install button (Android/Desktop) */}
                            {deferredPrompt && (
                                <button
                                    onClick={handleInstallClick}
                                    className="w-full py-3 bg-maison-black text-maison-ivory text-sm font-light tracking-wider hover:bg-maison-charcoal transition-colors duration-300"
                                >
                                    Install Now
                                </button>
                            )}

                            {/* Dismiss link */}
                            <button
                                onClick={handleDismiss}
                                className="w-full mt-2 py-2 text-xs text-maison-graphite/60 hover:text-maison-charcoal font-light transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
