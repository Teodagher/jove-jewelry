import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

interface ValidatePromoCodeRequest {
    code: string;
    subtotal: number;
    customerEmail: string;
}

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            );
        }

        const body: ValidatePromoCodeRequest = await request.json();
        const { code, subtotal, customerEmail } = body;

        // Validate input
        if (!code || !subtotal || !customerEmail) {
            return NextResponse.json(
                {
                    valid: false,
                    message: 'Missing required fields'
                },
                { status: 400 }
            );
        }

        // Normalize code to uppercase
        const normalizedCode = code.trim().toUpperCase();

        // Fetch promo code
        const { data: promoCode, error: fetchError } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', normalizedCode)
            .single();

        if (fetchError || !promoCode) {
            return NextResponse.json({
                valid: false,
                message: 'Invalid promo code'
            });
        }

        // Check if active
        if (!promoCode.is_active) {
            return NextResponse.json({
                valid: false,
                message: 'This promo code is no longer active'
            });
        }

        // Check validity period
        const now = new Date();
        if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
            return NextResponse.json({
                valid: false,
                message: 'This promo code is not yet valid'
            });
        }
        if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
            return NextResponse.json({
                valid: false,
                message: 'This promo code has expired'
            });
        }

        // Check max uses
        if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
            return NextResponse.json({
                valid: false,
                message: 'This promo code has reached its usage limit'
            });
        }

        // Check customer usage limit
        if (promoCode.max_uses_per_customer) {
            const { count } = await supabase
                .from('promo_code_usage')
                .select('*', { count: 'exact', head: true })
                .eq('promo_code_id', promoCode.id)
                .eq('customer_email', customerEmail.toLowerCase());

            if (count && count >= promoCode.max_uses_per_customer) {
                return NextResponse.json({
                    valid: false,
                    message: 'You have already used this promo code the maximum number of times'
                });
            }
        }

        // Check minimum order value
        if (promoCode.min_order_value && subtotal < promoCode.min_order_value) {
            return NextResponse.json({
                valid: false,
                message: `Minimum order value of $${promoCode.min_order_value} required for this promo code`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (promoCode.discount_type === 'percentage') {
            discountAmount = (subtotal * promoCode.discount_value) / 100;
        } else if (promoCode.discount_type === 'fixed') {
            discountAmount = Math.min(promoCode.discount_value, subtotal);
        }

        const finalTotal = Math.max(0, subtotal - discountAmount);

        return NextResponse.json({
            valid: true,
            message: `Promo code applied! You saved $${discountAmount.toFixed(2)}`,
            discount: {
                type: promoCode.discount_type,
                value: promoCode.discount_value,
                amount: discountAmount,
                finalTotal: finalTotal
            },
            promoCode: {
                id: promoCode.id,
                code: promoCode.code,
                description: promoCode.description
            }
        });

    } catch (error: any) {
        console.error('Promo code validation error:', error);
        return NextResponse.json(
            {
                valid: false,
                error: error.message || 'Failed to validate promo code'
            },
            { status: 500 }
        );
    }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
