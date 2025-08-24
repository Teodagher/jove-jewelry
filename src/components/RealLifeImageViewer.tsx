'use client';

import React, { useState } from 'react';

interface RealLifeImageViewerProps {
  jewelryType: 'bracelet' | 'ring' | 'necklace';
}

export default function RealLifeImageViewer({ jewelryType }: RealLifeImageViewerProps) {
  const [showRealLife, setShowRealLife] = useState(false);

  // Simple URLs without cache busting
  const realLifeImageUrls = {
    bracelet: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/bracelets/bracelet-real-life.webp',
    ring: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/rings/ring-real-life.webp',
    necklace: 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/item-pictures/necklaces/necklace-real-life.webp'
  };

  if (!showRealLife) {
    // Show the toggle button on the preview image itself
    return (
      <button
        onClick={() => setShowRealLife(true)}
        className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 group"
        title="Show real-life sample"
      >
        <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  // When active, show the real-life image as full overlay
  return (
    <div className="absolute inset-0 z-20 bg-white rounded-lg shadow-xl border-2 border-gray-200">
      <div className="relative w-full h-full">
        {/* Real-life Image */}
        <img
          src={realLifeImageUrls[jewelryType]}
          alt={`Real-life ${jewelryType} sample`}
          className="w-full h-full object-cover rounded-lg"
        />
        
        {/* Disclaimer */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 rounded-b-lg">
          <p className="text-xs text-center leading-relaxed">
            <span className="font-medium">Sample image:</span> Colors and materials may vary from your customized design
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={() => setShowRealLife(false)}
          className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors shadow-lg"
          title="Close real-life sample"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Back to preview button */}
        <button
          onClick={() => setShowRealLife(false)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-2 hover:bg-white transition-colors shadow-lg"
          title="Back to customized preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Indicator badge - inside the image */}
      <div className="absolute top-16 left-4 z-30">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          Real-life sample
        </div>
      </div>
    </div>
  );
}
