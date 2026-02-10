import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin PWA Test - Maison Jové',
    description: 'Test page for admin PWA installation',
}

export default function AdminPWATestPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Admin PWA Installation Test</h1>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Manifest Check</h2>
                    <div className="space-y-2 text-sm font-mono">
                        <div>
                            <span className="text-gray-400">Manifest URL:</span>
                            <br />
                            <a href="/admin-manifest.json" target="_blank" className="text-blue-400 hover:underline">
                                /admin-manifest.json
                            </a>
                        </div>
                        <div className="mt-4">
                            <span className="text-gray-400">Current Page:</span>
                            <br />
                            <span id="current-url" className="text-green-400"></span>
                        </div>
                        <div className="mt-4">
                            <span className="text-gray-400">Display Mode:</span>
                            <br />
                            <span id="display-mode" className="text-green-400"></span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Installation Instructions</h2>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold text-amber-400 mb-2">iOS (Safari):</h3>
                            <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                <li>Tap the Share button (square with arrow)</li>
                                <li>Scroll down and tap "Add to Home Screen"</li>
                                <li>Name it "Jové Admin"</li>
                                <li>Tap "Add"</li>
                            </ol>
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-400 mb-2">Android (Chrome):</h3>
                            <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                <li>Tap the menu (three dots)</li>
                                <li>Tap "Install app" or "Add to Home screen"</li>
                                <li>Tap "Install"</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Manifest Content</h2>
                    <pre id="manifest-content" className="text-xs bg-gray-900 p-4 rounded overflow-x-auto text-gray-300">
                        Loading...
                    </pre>
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/admin"
                        className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Back to Admin Dashboard
                    </a>
                </div>
            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
        // Update current URL
        document.getElementById('current-url').textContent = window.location.href;
        
        // Check display mode
        const displayMode = window.matchMedia('(display-mode: standalone)').matches ? 'Standalone (PWA)' : 'Browser';
        document.getElementById('display-mode').textContent = displayMode;
        
        // Fetch and display manifest
        fetch('/admin-manifest.json')
          .then(r => r.json())
          .then(data => {
            document.getElementById('manifest-content').textContent = JSON.stringify(data, null, 2);
          })
          .catch(err => {
            document.getElementById('manifest-content').textContent = 'Error loading manifest: ' + err.message;
          });
      `}} />
        </div>
    )
}
