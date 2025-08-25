'use client';

import React from 'react';

interface HandcraftedBannerProps {
  className?: string;
}

export default function HandcraftedBanner({ className = '' }: HandcraftedBannerProps) {
  return (
    <div 
      className={`handcrafted-banner ${className}`}
      role="note" 
      aria-label="Handcrafted to Order"
    >
      <span className="handcrafted-icon" aria-hidden="true">
        {/* Inline SVG icon: jeweler's loupe + sparkles */}
        <svg viewBox="0 0 64 64" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="26" r="12" stroke="currentColor" strokeWidth="3"/>
          <path d="M35 35 L52 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          {/* sparkles */}
          <path d="M49 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" fill="currentColor"/>
          <path d="M12 48l1.2 2.4 2.4 1.2-2.4 1.2L12 55.2 10.8 52.8 8.4 51.6l2.4-1.2L12 48Z" fill="currentColor"/>
        </svg>
      </span>
      <div className="handcrafted-text">
        <strong>Handcrafted to Order</strong>
        <div>Each piece is carefully made with precision and passion, ready for you within <strong>5–10 business days</strong>.</div>
      </div>
    </div>
  );
}
