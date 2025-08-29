'use client';

import Image from 'next/image';
import Link from 'next/link';

const PoweredByAstryCustomization = () => {
  return (
    <div className="flex items-center justify-center py-6">
      <Link 
        href="https://astry.agency" 
        target="_blank" 
        rel="noopener noreferrer"
        className="group flex items-center gap-2 transition-all duration-200"
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
        <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-200">
          Powered by{' '}
          <span className="font-medium text-gray-600 dark:text-gray-400">
            astry.agency
          </span>
        </span>
      </Link>
    </div>
  );
};

export default PoweredByAstryCustomization;
