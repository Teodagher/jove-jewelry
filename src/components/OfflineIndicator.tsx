'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowIndicator(true);

            // Hide after 3 seconds
            setTimeout(() => setShowIndicator(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowIndicator(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {showIndicator && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
                >
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${isOnline
                                ? 'bg-green-500 text-white'
                                : 'bg-orange-500 text-white'
                            }`}
                    >
                        {isOnline ? (
                            <>
                                <Wifi size={16} />
                                <span className="text-sm font-medium">Back Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={16} />
                                <span className="text-sm font-medium">Offline Mode</span>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
