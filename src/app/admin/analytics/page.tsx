'use client';

import { ExternalLink, BarChart3, TrendingUp, Users, MousePointer, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const clarityUrl = 'https://clarity.microsoft.com/projects/view/t3l06p2cdm/dashboard?date=Last%2030%20days';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-light text-gray-900 font-serif tracking-wider">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View website analytics and user behavior insights powered by Microsoft Clarity
          </p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="jove-bg-card rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500">
        <div className="p-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="inline-flex p-4 rounded-lg bg-blue-100">
                <BarChart3 className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-gray-900 mb-3">
                Microsoft Clarity Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Access your complete analytics dashboard to view real-time user behavior,
                session recordings, heatmaps, and performance insights for Maison Jove.
              </p>
              <a
                href={clarityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <ExternalLink className="h-5 w-5" />
                Open Analytics Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="jove-bg-card p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">Session Recordings</h3>
          </div>
          <p className="text-sm text-gray-600">
            Watch real user sessions to understand how visitors interact with your site
          </p>
        </div>

        <div className="jove-bg-card p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <MousePointer className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900">Heatmaps</h3>
          </div>
          <p className="text-sm text-gray-600">
            See where users click, scroll, and spend the most time on your pages
          </p>
        </div>

        <div className="jove-bg-card p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900">Conversion Tracking</h3>
          </div>
          <p className="text-sm text-gray-600">
            Monitor user journeys and identify conversion bottlenecks
          </p>
        </div>

        <div className="jove-bg-card p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">Performance Metrics</h3>
          </div>
          <p className="text-sm text-gray-600">
            Track page load times, user engagement, and site performance
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="jove-bg-card rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">Note:</span> The dashboard shows data from the last 30 days.
          You can adjust the date range once you open the dashboard.
        </p>
      </div>
    </div>
  );
}
