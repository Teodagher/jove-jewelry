'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { CustomizationService } from '@/services/customizationService';

interface JewelryItem {
    id: string;
    name: string;
    type: string;
    slug: string;
    description: string | null;
    base_image_url: string | null;
    base_price: number;
    product_type: 'simple' | 'customizable';
    display_order: number;
}

interface PresetDesign {
    id: string;
    jewelry_item_id: string;
    name: string;
    description: string | null;
    slug: string;
    customization_data: Record<string, string>;
    preview_image_url: string | null;
    badge_text: string | null;
    badge_color: string | null;
    display_order: number;
    jewelry_item?: JewelryItem;
}

export default function MobileCustomizeGrid() {
    const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
    const [presets, setPresets] = useState<PresetDesign[]>([]);
    const [presetImages, setPresetImages] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);

    // Check if running in standalone mode (PWA)
    useEffect(() => {
        const checkStandalone = () => {
            const isInStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');

            setIsStandalone(isInStandaloneMode);
        };

        checkStandalone();
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch jewelry items
            const { data: items, error: itemsError } = await supabase
                .from('jewelry_items')
                .select('*')
                .eq('is_active', true)
                .eq('product_type', 'customizable')
                .order('display_order', { ascending: true });

            if (!itemsError && items) {
                setJewelryItems(items);
            }

            // Fetch preset designs
            const { data: presetsData, error: presetsError } = await supabase
                .from('preset_designs')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(6);

            const typedPresetsData = presetsData as any[];
            const typedItems = items as any[];
            if (!presetsError && typedPresetsData && typedPresetsData.length > 0) {
                setPresets(typedPresetsData);

                // Generate preview images for each preset
                const imagePromises = typedPresetsData.map(async (preset) => {
                    const item = typedItems?.find((i: { id: string }) => i.id === preset.jewelry_item_id);
                    if (item && preset.customization_data) {
                        const imageUrl = await CustomizationService.generateVariantImageUrl(
                            item.type,
                            preset.customization_data
                        );
                        return { id: preset.id, url: imageUrl };
                    }
                    return { id: preset.id, url: null };
                });

                const images = await Promise.all(imagePromises);
                const imageMap: Record<string, string> = {};
                images.forEach(img => {
                    if (img.url) imageMap[img.id] = img.url;
                });
                setPresetImages(imageMap);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getItemForPreset = (preset: PresetDesign) => {
        return jewelryItems.find(i => i.id === preset.jewelry_item_id);
    };

    // Show mobile native grid only in PWA mode
    if (!isStandalone) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-maison-ivory flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                        <div className="absolute inset-0 border-2 border-maison-gold/20 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-transparent border-t-maison-gold rounded-full animate-spin"></div>
                    </div>
                    <p className="text-maison-graphite font-light text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-maison-ivory">
            {/* Compact Header */}
            <div className="bg-maison-black text-maison-ivory px-4 py-6 safe-area-top">
                <h1 className="font-serif text-2xl font-light tracking-wide mb-1">
                    Customize
                </h1>
                <p className="text-maison-ivory/60 text-sm font-light">
                    Choose what to create
                </p>
            </div>

            {/* Main Grid - 2 columns for compact mobile view */}
            <div className="p-4 pb-28">
                {/* Jewelry Items Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {jewelryItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                href={`/customize/${item.slug}`}
                                className="block group"
                            >
                                <div className="bg-white rounded-lg overflow-hidden shadow-sm active:scale-95 transition-transform duration-200">
                                    {/* Image */}
                                    <div className="relative aspect-square overflow-hidden bg-maison-cream">
                                        {item.base_image_url ? (
                                            <Image
                                                src={item.base_image_url}
                                                alt={item.name}
                                                fill
                                                sizes="50vw"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-maison-gold/30" />
                                            </div>
                                        )}

                                        {/* Subtle overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-3">
                                        <h3 className="font-serif text-base font-light text-maison-black mb-0.5 truncate">
                                            {item.name}
                                        </h3>
                                        <p className="text-maison-graphite/70 text-xs font-light">
                                            From ${item.base_price.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Preset Designs Section */}
                {presets.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-serif text-lg font-light text-maison-black">
                                    Popular Designs
                                </h2>
                                <p className="text-maison-graphite/60 text-xs font-light">
                                    Ready to customize
                                </p>
                            </div>
                        </div>

                        {/* Horizontal scroll for presets */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
                            {presets.map((preset, index) => {
                                const item = getItemForPreset(preset);
                                const previewUrl = preset.preview_image_url || presetImages[preset.id];

                                return (
                                    <motion.div
                                        key={preset.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="flex-shrink-0 w-40 snap-start"
                                    >
                                        <Link
                                            href={`/customize/${item?.slug || 'necklaces'}?preset=${preset.slug}`}
                                            className="block group"
                                        >
                                            <div className="bg-maison-black rounded-lg overflow-hidden shadow-md active:scale-95 transition-transform duration-200">
                                                {/* Image */}
                                                <div className="relative aspect-[3/4] overflow-hidden">
                                                    {previewUrl ? (
                                                        <Image
                                                            src={previewUrl}
                                                            alt={preset.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-maison-charcoal to-maison-black flex items-center justify-center">
                                                            <Sparkles className="w-10 h-10 text-maison-gold/20" />
                                                        </div>
                                                    )}

                                                    {/* Badge */}
                                                    {preset.badge_text && (
                                                        <div className="absolute top-2 left-2">
                                                            <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider uppercase font-medium rounded-full bg-maison-gold text-maison-black">
                                                                {preset.badge_text}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-3 bg-gradient-to-t from-maison-black to-maison-charcoal">
                                                    <p className="text-maison-gold text-[10px] tracking-wider uppercase mb-1">
                                                        {item?.name || 'Jewelry'}
                                                    </p>
                                                    <h3 className="font-serif text-sm text-maison-ivory font-light line-clamp-2 leading-tight">
                                                        {preset.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Quick Info Cards */}
                <div className="mt-8 space-y-3">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-maison-gold/10 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-maison-gold" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-serif text-base text-maison-black mb-1">
                                    Handcrafted Quality
                                </h3>
                                <p className="text-maison-graphite/70 text-xs font-light leading-relaxed">
                                    Each piece is meticulously crafted by our master artisans
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-maison-graphite/30 flex-shrink-0" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-maison-gold/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-maison-gold text-lg font-serif">18K</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-serif text-base text-maison-black mb-1">
                                    Premium Materials
                                </h3>
                                <p className="text-maison-graphite/70 text-xs font-light leading-relaxed">
                                    18K gold and ethically sourced gemstones
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-maison-graphite/30 flex-shrink-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
