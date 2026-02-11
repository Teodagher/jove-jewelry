'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    fallback?: string;
}

export default function OptimizedImage({
    src,
    alt,
    fallback = '/images/placeholder.png',
    priority = false,
    ...props
}: OptimizedImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-maison-cream animate-pulse" />
            )}
            <Image
                {...props}
                src={imgSrc}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                quality={85}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImgSrc(fallback);
                    setIsLoading(false);
                }}
                style={{
                    ...props.style,
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out',
                }}
            />
        </div>
    );
}
