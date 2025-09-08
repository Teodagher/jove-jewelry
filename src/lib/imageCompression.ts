/**
 * Image compression utility using browser-based canvas compression
 * Since Sharp runs on Node.js server-side, we need browser-compatible solution for client-side compression
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  format?: 'webp' | 'jpeg' | 'png';
}

export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85, // Good balance between quality and size
      format = 'webp'
    } = options;

    // Create image element
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          format === 'webp' ? 'image/webp' : format === 'jpeg' ? 'image/jpeg' : 'image/png',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateOptimizedFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  
  return `${timestamp}-${cleanName}-${randomId}.webp`;
};

/**
 * Compress image to target around 100KB while maintaining quality
 * Uses progressive quality reduction until target size is reached
 */
export const compressToTargetSize = async (
  file: File,
  targetSizeKB: number = 100,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp'
  } = options;

  let quality = 0.95; // Start with high quality
  let compressedBlob: Blob;
  let attempts = 0;
  const maxAttempts = 8;

  do {
    try {
      compressedBlob = await compressImage(file, {
        maxWidth,
        maxHeight,
        quality,
        format
      });

      const sizeKB = compressedBlob.size / 1024;
      
      // If we're within 10% of target or below target, we're good
      if (sizeKB <= targetSizeKB || sizeKB <= targetSizeKB * 1.1) {
        break;
      }

      // Reduce quality for next attempt
      if (sizeKB > targetSizeKB * 2) {
        quality -= 0.15; // Bigger reduction for much larger files
      } else if (sizeKB > targetSizeKB * 1.5) {
        quality -= 0.1;
      } else {
        quality -= 0.05;
      }

      attempts++;
    } catch (error) {
      throw new Error(`Compression failed: ${error}`);
    }
  } while (quality > 0.1 && attempts < maxAttempts);

  return compressedBlob;
};

/**
 * Get estimated file size after compression
 */
export const getEstimatedCompressedSize = (
  originalSize: number,
  quality: number = 0.85,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): number => {
  // Rough estimation based on format and quality
  let compressionRatio: number;
  
  switch (format) {
    case 'webp':
      compressionRatio = quality * 0.3 + 0.1; // WebP is very efficient
      break;
    case 'jpeg':
      compressionRatio = quality * 0.5 + 0.2;
      break;
    case 'png':
      compressionRatio = 0.8; // PNG compression is limited
      break;
    default:
      compressionRatio = 0.5;
  }
  
  return originalSize * compressionRatio;
};
