'use client';

import { Market, MARKET_INFO, ADMIN_MARKETS } from '@/lib/market-client';

interface MarketSelectorProps {
  selectedMarket: Market;
  onMarketChange: (market: Market) => void;
  className?: string;
}

export default function MarketSelector({
  selectedMarket,
  onMarketChange,
  className = '',
}: MarketSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {ADMIN_MARKETS.map((market) => {
        const info = MARKET_INFO[market];
        const isSelected = selectedMarket === market;

        return (
          <button
            key={market}
            onClick={() => onMarketChange(market)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span className="text-lg">{info.flag}</span>
            <span>{info.name}</span>
            <span className="text-xs opacity-70">({info.currency})</span>
          </button>
        );
      })}
    </div>
  );
}
