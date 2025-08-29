'use client';

import Image from 'next/image';
import Link from 'next/link';

const PoweredByAstry = () => {
  return (
    <div className="flex items-center justify-center mt-8 mb-4">
      <Link 
        href="https://astry.agency" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
      >
        {/* Logo */}
        <div className="relative w-4 h-4">
          <Image
            src="/images/Astry logo website.png"
            alt="Astry Agency"
            fill
            className="object-contain"
          />
        </div>
        
        {/* Text */}
        <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
          Powered by{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            astry.agency
          </span>
        </span>
      </Link>
    </div>
  );
};

export default PoweredByAstry;
