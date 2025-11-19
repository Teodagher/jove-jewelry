'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const MARKET_NAMES: Record<string, string> = {
  'AU': 'Australia',
  'LB': 'Lebanon',
  'International': 'the International store'
}

export function RedirectNotification() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [market, setMarket] = useState<string>('')

  useEffect(() => {
    const redirected = searchParams.get('redirected')
    const from = searchParams.get('from')

    if (redirected === 'true' && from) {
      setMarket(MARKET_NAMES[from] || from)
      setShow(true)

      // Remove the query parameters from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('redirected')
      url.searchParams.delete('from')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleClose = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pt-4 px-4 pointer-events-none animate-in slide-in-from-top-2 duration-500">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full pointer-events-auto">
        <div className="p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              You've been redirected to {market}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              We've automatically directed you to the best store for your location.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
