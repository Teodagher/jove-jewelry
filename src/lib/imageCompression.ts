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
