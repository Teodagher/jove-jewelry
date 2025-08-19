'use client';

import React from 'react';

interface PaymentMethodCardProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * A classic payment method selection card with radio button styling.
 */
export function PaymentMethodCard({ title, subtitle, selected = true, onClick }: PaymentMethodCardProps) {
  return (
    <div
      className={[
        'relative rounded-lg p-3 border cursor-pointer transition-all duration-200',
        selected 
          ? 'border-zinc-400 bg-zinc-50' 
          : 'border-gray-300 bg-white hover:border-gray-400',
      ].join(' ')}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Radio button */}
        <div className="flex-shrink-0">
          <div className={[
            'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-200',
            selected 
              ? 'border-zinc-600 bg-zinc-600' 
              : 'border-gray-400'
          ].join(' ')}>
            {selected && (
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={[
            'text-sm font-medium transition-colors duration-200',
            selected ? 'text-zinc-900' : 'text-gray-900'
          ].join(' ')}>
            {title}
          </p>
          {subtitle ? (
            <p className={[
              'mt-0.5 text-xs transition-colors duration-200',
              selected ? 'text-zinc-600' : 'text-gray-600'
            ].join(' ')}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="flex-shrink-0">
            <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentMethodCard;


