'use client';

/**
 * Image Cache Service
 * 
 * Provides in-memory caching for loaded images with LRU eviction policy.
 * This eliminates the delay when users switch between configurations they've
 * already viewed.
 */

interface CachedImage {
  url: string;
  blobUrl?: string;
  loaded: boolean;
  error: boolean;
  timestamp: number;
  size: number;
}

class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private maxSize: number;
  private maxMemoryMB: number;
  private currentMemoryBytes: number = 0;

  constructor(maxSize: number = 50, maxMemoryMB: number = 100) {
    this.maxSize = maxSize;
    this.maxMemoryMB = maxMemoryMB;
  }

  /**
   * Get cached image entry
   */
  get(url: string): CachedImage | undefined {
    const entry = this.cache.get(url);
    if (entry) {
      // Update access time for LRU
      entry.timestamp = Date.now();
    }
    return entry;
  }

  /**
   * Check if image is cached and loaded
   */
  isLoaded(url: string): boolean {
    const entry = this.cache.get(url);
    return entry?.loaded ?? false;
  }

  /**
   * Check if image failed to load
   */
  hasError(url: string): boolean {
    const entry = this.cache.get(url);
    return entry?.error ?? false;
  }

  /**
   * Set image as loaded in cache
   */
  setLoaded(url: string, size: number = 0): void {
    const existing = this.cache.get(url);
    if (existing) {
      existing.loaded = true;
      existing.error = false;
      existing.size = size;
      existing.timestamp = Date.now();
    } else {
      this.cache.set(url, {
        url,
        loaded: true,
        error: false,
        timestamp: Date.now(),
        size
      });
      this.currentMemoryBytes += size;
      this.evictIfNeeded();
    }
  }

  /**
   * Set image as failed in cache
   */
  setError(url: string): void {
    const existing = this.cache.get(url);
    if (existing) {
      existing.error = true;
      existing.loaded = false;
      existing.timestamp = Date.now();
    } else {
      this.cache.set(url, {
        url,
        loaded: false,
        error: true,
        timestamp: Date.now(),
        size: 0
      });
    }
  }

  /**
   * Preload an image into cache
   */
  async preload(url: string): Promise<boolean> {
    // Skip if already cached and loaded
    if (this.isLoaded(url)) {
      return true;
    }

    // Skip if already failed
    if (this.hasError(url)) {
      return false;
    }

    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Estimate size (rough approximation based on dimensions)
        const estimatedSize = img.naturalWidth * img.naturalHeight * 4; // RGBA
        this.setLoaded(url, estimatedSize);
        resolve(true);
      };

      img.onerror = () => {
        this.setError(url);
        resolve(false);
      };

      // Start loading
      img.src = url;
    });
  }

  /**
   * Preload multiple images in priority order
   */
  async preloadBatch(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
    if (priority === 'high') {
      // Load sequentially for high priority (current image)
      for (const url of urls) {
        await this.preload(url);
      }
    } else {
      // Load in parallel for low priority (background preloading)
      await Promise.all(urls.map(url => this.preload(url)));
    }
  }

  /**
   * Get all cached URLs
   */
  getAllCached(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; memoryMB: number; maxSize: number; maxMemoryMB: number } {
    return {
      size: this.cache.size,
      memoryMB: this.currentMemoryBytes / (1024 * 1024),
      maxSize: this.maxSize,
      maxMemoryMB: this.maxMemoryMB
    };
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.currentMemoryBytes = 0;
  }

  /**
   * Evict oldest entries if cache exceeds limits
   */
  private evictIfNeeded(): void {
    // Check count limit
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    // Check memory limit
    const maxBytes = this.maxMemoryMB * 1024 * 1024;
    while (this.currentMemoryBytes > maxBytes && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldest: { url: string; timestamp: number } | null = null;

    for (const [url, entry] of this.cache) {
      if (!oldest || entry.timestamp < oldest.timestamp) {
        oldest = { url, timestamp: entry.timestamp };
      }
    }

    if (oldest) {
      const entry = this.cache.get(oldest.url);
      if (entry) {
        this.currentMemoryBytes -= entry.size;
      }
      this.cache.delete(oldest.url);
    }
  }
}

// Singleton instance
let globalImageCache: ImageCacheService | null = null;

export function getImageCache(): ImageCacheService {
  if (!globalImageCache) {
    globalImageCache = new ImageCacheService(50, 100);
  }
  return globalImageCache;
}

// Reset cache (useful for testing)
export function resetImageCache(): void {
  globalImageCache = null;
}

export { ImageCacheService };
export type { CachedImage };
