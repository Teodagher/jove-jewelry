// Service for managing variant images (multi-image galleries)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '@/lib/supabase/client';

// Type-safe wrapper for new tables not yet in Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface VariantImage {
  id: string;
  variant_key: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedMedia {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  tags: string[];
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface VariantSharedMedia {
  id: string;
  variant_key: string;
  shared_media_id: string;
  display_order: number;
  created_at: string;
}

export interface AllVariantImages {
  directImages: VariantImage[];
  sharedImages: (SharedMedia & { display_order: number })[];
}

export class VariantImagesService {
  /**
   * Get all images for a variant (both direct and shared)
   */
  static async getVariantImages(variantKey: string): Promise<AllVariantImages> {
    // Get direct variant images
    const { data: directImages, error: directError } = await db
      .from('variant_images')
      .select('*')
      .eq('variant_key', variantKey)
      .order('display_order', { ascending: true });

    if (directError) {
      console.error('Error fetching direct variant images:', directError);
    }

    // Get shared media linked to this variant
    const { data: sharedLinks, error: sharedError } = await db
      .from('variant_shared_media')
      .select(`
        display_order,
        shared_media:shared_media_id (*)
      `)
      .eq('variant_key', variantKey)
      .order('display_order', { ascending: true });

    if (sharedError) {
      console.error('Error fetching shared media links:', sharedError);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedImages = ((sharedLinks || []) as any[])
      .filter(link => link.shared_media)
      .map(link => ({
        ...(link.shared_media as SharedMedia),
        display_order: link.display_order
      }));

    return {
      directImages: directImages || [],
      sharedImages
    };
  }

  /**
   * Get images for variant by filename (convenience method)
   * Falls back to single existing image if no gallery images found
   */
  static async getVariantImagesByFilename(
    productType: string,
    filename: string
  ): Promise<string[]> {
    // Normalize variant key (remove extension)
    const variantKey = filename.replace(/\.[^/.]+$/, '');
    
    const { directImages, sharedImages } = await this.getVariantImages(variantKey);
    
    // Combine and sort all images
    const allImages: { url: string; order: number; isPrimary: boolean }[] = [
      ...directImages.map(img => ({
        url: img.image_url,
        order: img.display_order,
        isPrimary: img.is_primary
      })),
      ...sharedImages.map(img => ({
        url: img.image_url,
        order: img.display_order + 1000, // Offset shared images
        isPrimary: false
      }))
    ];

    // Sort by primary first, then by order
    allImages.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.order - b.order;
    });

    // If no gallery images, return empty (caller should fall back to single image)
    if (allImages.length === 0) {
      return [];
    }

    return allImages.map(img => img.url);
  }

  /**
   * Add a new image to a variant's gallery
   */
  static async addVariantImage(
    variantKey: string,
    imageUrl: string,
    isPrimary: boolean = false
  ): Promise<VariantImage | null> {
    // Get current max display order
    const { data: existing } = await db
      .from('variant_images')
      .select('display_order')
      .eq('variant_key', variantKey)
      .order('display_order', { ascending: false })
      .limit(1) as { data: { display_order: number }[] | null };

    const nextOrder = ((existing?.[0]?.display_order) ?? -1) + 1;

    // If this is primary, unset other primaries
    if (isPrimary) {
      await db
        .from('variant_images')
        .update({ is_primary: false })
        .eq('variant_key', variantKey);
    }

    const { data, error } = await db
      .from('variant_images')
      .insert({
        variant_key: variantKey,
        image_url: imageUrl,
        display_order: nextOrder,
        is_primary: isPrimary
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding variant image:', error);
      return null;
    }

    return data;
  }

  /**
   * Update display order for variant images
   */
  static async reorderVariantImages(
    variantKey: string,
    imageIds: string[]
  ): Promise<boolean> {
    try {
      const updates = imageIds.map((id, index) => ({
        id,
        variant_key: variantKey,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await db
          .from('variant_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) {
          console.error('Error updating image order:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error reordering images:', error);
      return false;
    }
  }

  /**
   * Set an image as primary
   */
  static async setPrimaryImage(
    variantKey: string,
    imageId: string
  ): Promise<boolean> {
    try {
      // Unset all primaries for this variant
      await db
        .from('variant_images')
        .update({ is_primary: false })
        .eq('variant_key', variantKey);

      // Set the new primary
      const { error } = await db
        .from('variant_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      return !error;
    } catch (error) {
      console.error('Error setting primary image:', error);
      return false;
    }
  }

  /**
   * Delete a variant image
   */
  static async deleteVariantImage(imageId: string): Promise<boolean> {
    const { error } = await db
      .from('variant_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting variant image:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete variant image and its storage file
   */
  static async deleteVariantImageWithStorage(
    imageId: string,
    imageUrl: string,
    storageBucket: string = 'item-pictures'
  ): Promise<boolean> {
    // Extract file path from URL
    const urlParts = imageUrl.split(`/storage/v1/object/public/${storageBucket}/`);
    if (urlParts.length === 2) {
      const filePath = urlParts[1].split('?')[0]; // Remove query params
      
      // Delete from storage
      const { error: storageError } = await db.storage
        .from(storageBucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue to delete database record anyway
      }
    }

    // Delete from database
    return this.deleteVariantImage(imageId);
  }

  // =========================================================================
  // SHARED MEDIA METHODS
  // =========================================================================

  /**
   * Get all shared media, optionally filtered by tags
   */
  static async getSharedMedia(tags?: string[]): Promise<SharedMedia[]> {
    let query = supabase
      .from('shared_media')
      .select('*')
      .order('created_at', { ascending: false });

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching shared media:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Add new shared media
   */
  static async addSharedMedia(
    name: string,
    imageUrl: string,
    options?: {
      description?: string;
      thumbnailUrl?: string;
      tags?: string[];
      fileSizeBytes?: number;
      width?: number;
      height?: number;
    }
  ): Promise<SharedMedia | null> {
    const { data, error } = await db
      .from('shared_media')
      .insert({
        name,
        image_url: imageUrl,
        description: options?.description || null,
        thumbnail_url: options?.thumbnailUrl || null,
        tags: options?.tags || [],
        file_size_bytes: options?.fileSizeBytes || null,
        width: options?.width || null,
        height: options?.height || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding shared media:', error);
      return null;
    }

    return data;
  }

  /**
   * Update shared media
   */
  static async updateSharedMedia(
    id: string,
    updates: Partial<Omit<SharedMedia, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    const { error } = await db
      .from('shared_media')
      .update(updates)
      .eq('id', id);

    return !error;
  }

  /**
   * Delete shared media
   */
  static async deleteSharedMedia(id: string): Promise<boolean> {
    // First delete all links to variants
    await db
      .from('variant_shared_media')
      .delete()
      .eq('shared_media_id', id);

    // Then delete the shared media
    const { error } = await db
      .from('shared_media')
      .delete()
      .eq('id', id);

    return !error;
  }

  /**
   * Link shared media to a variant
   */
  static async linkSharedMediaToVariant(
    variantKey: string,
    sharedMediaId: string
  ): Promise<boolean> {
    // Get current max display order for shared media in this variant
    const { data: existing } = await db
      .from('variant_shared_media')
      .select('display_order')
      .eq('variant_key', variantKey)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { error } = await db
      .from('variant_shared_media')
      .upsert({
        variant_key: variantKey,
        shared_media_id: sharedMediaId,
        display_order: nextOrder
      });

    return !error;
  }

  /**
   * Unlink shared media from a variant
   */
  static async unlinkSharedMediaFromVariant(
    variantKey: string,
    sharedMediaId: string
  ): Promise<boolean> {
    const { error } = await db
      .from('variant_shared_media')
      .delete()
      .eq('variant_key', variantKey)
      .eq('shared_media_id', sharedMediaId);

    return !error;
  }

  /**
   * Get all variants linked to a shared media item
   */
  static async getVariantsForSharedMedia(sharedMediaId: string): Promise<string[]> {
    const { data, error } = await db
      .from('variant_shared_media')
      .select('variant_key')
      .eq('shared_media_id', sharedMediaId);

    if (error) {
      console.error('Error fetching variants for shared media:', error);
      return [];
    }

    return data?.map((row: { variant_key: string }) => row.variant_key) || [];
  }
}

export default VariantImagesService;
