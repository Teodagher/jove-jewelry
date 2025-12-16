'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PromoCode {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    influencer_name: string | null;
    influencer_email: string | null;
    influencer_payout_type: string | null;
    influencer_payout_value: number | null;
    is_active: boolean;
}

interface PromoCodeFormProps {
    promoCode: PromoCode | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PromoCodeForm({ promoCode, onClose, onSuccess }: PromoCodeFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: promoCode?.code || '',
        description: promoCode?.description || '',
        discount_type: promoCode?.discount_type || 'percentage',
        discount_value: promoCode?.discount_value || 0,
        influencer_name: promoCode?.influencer_name || '',
        influencer_email: promoCode?.influencer_email || '',
        influencer_payout_type: promoCode?.influencer_payout_type || 'none',
        influencer_payout_value: promoCode?.influencer_payout_value || 0,
        is_active: promoCode?.is_active ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSubmit = {
                code: formData.code.toUpperCase().trim(),
                description: formData.description.trim() || null,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                influencer_name: formData.influencer_name.trim() || null,
                influencer_email: formData.influencer_email.trim() || null,
                influencer_payout_type: formData.influencer_payout_type === 'none' ? null : formData.influencer_payout_type,
                influencer_payout_value: formData.influencer_payout_type === 'none' ? 0 : Number(formData.influencer_payout_value),
                is_active: formData.is_active,
            };

            if (promoCode) {
                // Update existing
                const { error } = await (supabase
                    .from('promo_codes') as any)
                    .update(dataToSubmit)
                    .eq('id', promoCode.id);

                if (error) throw error;
                alert('Promo code updated successfully!');
            } else {
                // Create new
                const { error } = await (supabase
                    .from('promo_codes') as any)
                    .insert(dataToSubmit);

                if (error) throw error;
                alert('Promo code created successfully!');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving promo code:', error);
            alert(error.message || 'Failed to save promo code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full my-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {promoCode ? 'Edit Promo Code' : 'Create Promo Code'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {promoCode ? 'Update promo code settings' : 'Create a new promotional code'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono text-lg"
                                    placeholder="SAVE20"
                                    disabled={!!promoCode}
                                />
                                <p className="text-xs text-gray-500 mt-1">Will be automatically uppercase</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.is_active ? 'active' : 'inactive'}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="20% off for new customers"
                            />
                        </div>
                    </div>

                    {/* Discount Settings */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">%</span>
                            Discount Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Discount Value <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                        {formData.discount_type === 'percentage' ? '%' : '$'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Influencer Settings */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">👤</span>
                            Influencer Tracking
                            <span className="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Influencer Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.influencer_name}
                                        onChange={(e) => setFormData({ ...formData, influencer_name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="@influencer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Influencer Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.influencer_email}
                                        onChange={(e) => setFormData({ ...formData, influencer_email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="influencer@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payout Type
                                    </label>
                                    <select
                                        value={formData.influencer_payout_type || 'none'}
                                        onChange={(e) => setFormData({ ...formData, influencer_payout_type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="none">No Payout</option>
                                        <option value="percentage_of_sale">% of Sale</option>
                                        <option value="fixed">Fixed Amount per Use</option>
                                    </select>
                                </div>

                                {formData.influencer_payout_type !== 'none' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payout Value
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.influencer_payout_value}
                                                onChange={(e) => setFormData({ ...formData, influencer_payout_value: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={formData.influencer_payout_type?.includes('percentage') ? '10' : '5.00'}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                                {formData.influencer_payout_type?.includes('percentage') ? '%' : '$'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            disabled={loading}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                            {loading ? 'Saving...' : promoCode ? 'Update Promo Code' : 'Create Promo Code'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
