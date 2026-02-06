'use client';

import { Market, MARKET_INFO, ADMIN_MARKETS } from '@/lib/market-client';
import { getCurrency, EXCHANGE_RATES } from '@/lib/currency';

interface MarketSelectorProps {
  selectedMarket: Market;
  onMarketChange: (market: Market) => void;
  className?: string;
  showRates?: boolean;
}

export default function MarketSelector({
  selectedMarket,
  onMarketChange,
  className = '',
  showRates = false,
}: MarketSelectorProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {ADMIN_MARKETS.map((market) => {
          const info = MARKET_INFO[market];
          const currency = getCurrency(market);
          const rate = EXCHANGE_RATES[currency];
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
              <span className="text-xs opacity-70">({currency})</span>
              {showRates && rate !== 1 && (
                <span className="text-xs opacity-50">×{rate}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Preview how prices appear in different markets. All prices stored in USD.
      </p>
    </div>
  );
}
