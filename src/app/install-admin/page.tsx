import type { Metadata, Viewport } from 'next'
import Link from 'next/link'

export const viewport: Viewport = {
    themeColor: '#111827',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
}

export const metadata: Metadata = {
    title: 'Install Admin App - Maison Jové',
    description: 'Install the Maison Jové Admin Dashboard as a standalone app',
    manifest: '/admin-manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Jové Admin',
    },
    icons: {
        icon: '/admin-icon.png',
        apple: '/icons/admin-apple-touch-icon.png',
    },
}

export default function InstallAdminPage() {
    return (
        <html lang="en">
            <head>
                {/* Force admin manifest */}
                <link rel="manifest" href="/admin-manifest.json" />
                <meta name="theme-color" content="#111827" />
                <link rel="icon" href="/admin-icon.png" />
                <link rel="apple-touch-icon" href="/icons/admin-apple-touch-icon.png" />
            </head>
            <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen">
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="max-w-md w-full">
                        {/* Icon */}
                        <div className="flex justify-center mb-8">
                            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-amber-500/20">
                                <img
                                    src="/admin-icon.png"
                                    alt="Jové Admin"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white mb-3">
                                Jové Admin
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Install as a standalone app
                            </p>
                        </div>

                        {/* Instructions Card */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Installation Steps
                            </h2>

                            <div className="space-y-4">
                                {/* iOS Instructions */}
                                <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                        </svg>
                                        <span className="font-semibold text-white">iOS (Safari)</span>
                                    </div>
                                    <ol className="space-y-2 text-sm text-gray-300 ml-7">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">1.</span>
                                            <span>Tap the <strong>Share</strong> button (square with arrow ↑)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">2.</span>
                                            <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">3.</span>
                                            <span>Tap <strong>"Add"</strong> in the top right</span>
                                        </li>
                                    </ol>
                                </div>

                                {/* Android Instructions */}
                                <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 00-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C2.92 12.03 1.6 16.25 1.6 16.25h20.8s-1.32-4.22-4.8-6.77zM7.8 14.4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8.4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                                        </svg>
                                        <span className="font-semibold text-white">Android (Chrome)</span>
                                    </div>
                                    <ol className="space-y-2 text-sm text-gray-300 ml-7">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">1.</span>
                                            <span>Tap the <strong>menu</strong> (three dots ⋮)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">2.</span>
                                            <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">3.</span>
                                            <span>Tap <strong>"Install"</strong></span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-2xl p-6 mb-6 border border-amber-500/20">
                            <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
                            <ul className="space-y-3">
                                {[
                                    'Quick access from home screen',
                                    'Full-screen app experience',
                                    'Offline functionality',
                                    'Fast performance',
                                    'Separate from customer app',
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3 text-gray-300">
                                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link
                                href="/admin"
                                className="block w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-center px-6 py-4 rounded-xl font-semibold shadow-lg shadow-amber-500/30 transition-all transform hover:scale-[1.02]"
                            >
                                Continue to Admin Dashboard
                            </Link>

                            <button
                                onClick={() => window.location.reload()}
                                className="block w-full bg-gray-700 hover:bg-gray-600 text-white text-center px-6 py-3 rounded-xl font-medium transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>

                        {/* Footer Note */}
                        <p className="text-center text-gray-500 text-sm mt-6">
                            Make sure you're on this page when adding to home screen
                        </p>
                    </div>
                </div>
            </body>
        </html>
    )
}
