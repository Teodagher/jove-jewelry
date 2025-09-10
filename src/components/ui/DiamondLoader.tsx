'use client';


interface DiamondLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showText?: boolean;
  className?: string;
}

export default function DiamondLoader({ 
  size = 'md', 
  text = 'Loading the Jové experience', 
  showText = true,
  className = ''
}: DiamondLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Diamond SVG with rotation animation */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg 
          className="w-full h-full animate-spin" 
          viewBox="0 0 24 24" 
          fill="none"
          style={{ 
            animation: 'diamondSpin 2s linear infinite, diamondPulse 1.5s ease-in-out infinite alternate'
          }}
        >
          {/* Diamond shape with gradient */}
          <defs>
            <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8">
                <animate 
                  attributeName="stopColor" 
                  values="#3B82F6;#8B5CF6;#EC4899;#3B82F6" 
                  dur="3s" 
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6">
                <animate 
                  attributeName="stopColor" 
                  values="#8B5CF6;#EC4899;#F59E0B;#8B5CF6" 
                  dur="3s" 
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4">
                <animate 
                  attributeName="stopColor" 
                  values="#EC4899;#F59E0B;#3B82F6;#EC4899" 
                  dur="3s" 
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            
            {/* Sparkle effect */}
            <filter id="sparkle">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main diamond shape */}
          <path 
            d="M12 2 L20 8 L12 22 L4 8 Z" 
            fill="url(#diamondGradient)"
            stroke="currentColor"
            strokeWidth="0.5"
            filter="url(#sparkle)"
            className="text-blue-200"
          />
          
          {/* Inner facets for more realistic look */}
          <path 
            d="M12 2 L16 8 L12 12 L8 8 Z" 
            fill="rgba(255,255,255,0.3)"
            opacity="0.6"
          />
          <path 
            d="M12 12 L20 8 L12 22 Z" 
            fill="rgba(0,0,0,0.1)"
          />
          <path 
            d="M12 12 L4 8 L12 22 Z" 
            fill="rgba(0,0,0,0.05)"
          />
        </svg>
        
        {/* Sparkle dots around diamond */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-white rounded-full opacity-70`}
              style={{
                top: `${20 + Math.sin((i * 60 + Date.now() / 100) * Math.PI / 180) * 40}%`,
                left: `${50 + Math.cos((i * 60 + Date.now() / 100) * Math.PI / 180) * 40}%`,
                animation: `sparkle ${1 + i * 0.2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Loading text */}
      {showText && (
        <div className="text-center">
          <p className={`font-medium text-gray-700 ${textSizeClasses[size]} tracking-wide`}>
            {text}
          </p>
          <div className="flex justify-center items-center space-x-1 mt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full opacity-60"
                style={{
                  animation: `bounce 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes diamondSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes diamondPulse {
          from { 
            transform: scale(0.95);
            opacity: 0.7;
          }
          to { 
            transform: scale(1.05);
            opacity: 1;
          }
        }
        
        @keyframes sparkle {
          from { 
            opacity: 0.3;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}