'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, DollarSign, Users, TrendingUp, Tag } from 'lucide-react';
import PromoCodeForm from '@/components/admin/PromoCodeForm';

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
    current_uses: number;
    is_active: boolean;
    created_at: string;
}

interface PromoCodeUsage {
    promo_code_id: string;
    influencer_payout_amount: number;
    discount_amount: number;
}

export default function PromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [usageData, setUsageData] = useState<Record<string, { totalPayout: number; uses: number }>>({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            // Fetch promo codes
            const { data: codes, error: codesError } = await (supabase
                .from('promo_codes') as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (codesError) throw codesError;

            // Fetch usage data for all promo codes
            const { data: usage, error: usageError } = await (supabase
                .from('promo_code_usage') as any)
                .select('promo_code_id, influencer_payout_amount, discount_amount');

            if (usageError) throw usageError;

            // Calculate totals per promo code
            const usageMap: Record<string, { totalPayout: number; uses: number; totalDiscount: number }> = {};
            (usage || []).forEach((u: PromoCodeUsage) => {
                if (!usageMap[u.promo_code_id]) {
                    usageMap[u.promo_code_id] = { totalPayout: 0, uses: 0, totalDiscount: 0 };
                }
                usageMap[u.promo_code_id].totalPayout += u.influencer_payout_amount || 0;
                usageMap[u.promo_code_id].totalDiscount += u.discount_amount || 0;
                usageMap[u.promo_code_id].uses += 1;
            });

            setPromoCodes(codes || []);
            setUsageData(usageMap);
        } catch (error) {
            console.error('Error fetching promo codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;

        try {
            const { error } = await (supabase
                .from('promo_codes') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPromoCodes();
        } catch (error) {
            console.error('Error deleting promo code:', error);
            alert('Failed to delete promo code');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase
                .from('promo_codes') as any)
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchPromoCodes();
        } catch (error) {
            console.error('Error toggling promo code:', error);
        }
    };

    const formatDiscount = (type: string, value: number) => {
        return type === 'percentage' ? `${value}%` : `$${value}`;
    };

    const formatPayout = (type: string | null, value: number | null) => {
        if (!type || type === 'none' || !value) return 'No payout';
        if (type === 'percentage_of_sale') return `${value}% of sale`;
        if (type === 'fixed') return `$${value} per use`;
        return 'No payout';
    };

    const totalInfluencerPayout = Object.values(usageData).reduce((sum, data) => sum + data.totalPayout, 0);
    const totalUses = promoCodes.reduce((sum, code) => sum + code.current_uses, 0);
    const codesWithInfluencers = promoCodes.filter(c => c.influencer_name).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
                    <p className="text-gray-600 mt-1">Manage promotional codes and influencer tracking</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCode(null);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800"
                >
                    <Plus className="w-4 h-4" />
                    Create Promo Code
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Codes</p>
                            <p className="text-3xl font-bold text-gray-900">{promoCodes.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Uses</p>
                            <p className="text-3xl font-bold text-gray-900">{totalUses}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">With Influencers</p>
                            <p className="text-3xl font-bold text-gray-900">{codesWithInfluencers}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-black rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Total Owed</p>
                            <p className="text-3xl font-bold text-white">${totalInfluencerPayout.toFixed(2)}</p>
                        </div>
                        <div className="w-12 h-12 bg-white bg-opacity-10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Promo Codes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code & Influencer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payout Settings
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Owed
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {promoCodes.map((code) => {
                            const usage = usageData[code.id] || { totalPayout: 0, uses: 0 };
                            return (
                                <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-bold text-gray-900 font-mono tracking-wide">{code.code}</div>
                                            {code.description && (
                                                <div className="text-xs text-gray-500 mt-0.5">{code.description}</div>
                                            )}
                                            {code.influencer_name && (
                                                <div className="mt-2 flex items-center gap-1.5 bg-gray-50 rounded px-2 py-1 inline-flex">
                                                    <Users className="w-3.5 h-3.5 text-gray-600" />
                                                    <div>
                                                        <div className="text-xs font-medium text-gray-900">{code.influencer_name}</div>
                                                        <div className="text-xs text-gray-500">{code.influencer_email}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-gray-900 text-white">
                                            {formatDiscount(code.discount_type, code.discount_value)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{code.current_uses} uses</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 font-medium">
                                            {formatPayout(code.influencer_payout_type, code.influencer_payout_value)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {code.influencer_name ? (
                                            <div className="text-sm font-bold text-gray-900">
                                                ${usage.totalPayout.toFixed(2)}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => toggleActive(code.id, code.is_active)}
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-md transition-colors ${code.is_active
                                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {code.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setEditingCode(code);
                                                setShowForm(true);
                                            }}
                                            className="text-gray-600 hover:text-gray-900 mr-4 transition-colors hover:bg-gray-100 p-2 rounded"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 p-2 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {promoCodes.length === 0 && (
                    <div className="text-center py-12">
                        <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No promo codes yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first promo code to get started!</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <PromoCodeForm
                    promoCode={editingCode}
                    onClose={() => {
                        setShowForm(false);
                        setEditingCode(null);
                    }}
                    onSuccess={fetchPromoCodes}
                />
            )}
        </div>
    );
}
