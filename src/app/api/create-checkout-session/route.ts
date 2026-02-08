import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  })
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      cartItems,
      customerInfo,
      deliveryAddress,
      market,
      currency
    } = body;

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!customerInfo || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    if (!market || !currency) {
      return NextResponse.json(
        { error: 'Market and currency are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.total_price * item.quantity), 0);

    // Create line items for Stripe
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => {
      const customizationText = Object.entries(item.customization_data || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const formattedValue = typeof value === 'string'
            ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : value;
          return `${formattedKey}: ${formattedValue}`;
        })
        .join(' • ');

      const jewelryType = item.jewelry_type || 'jewelry';
      const formattedType = jewelryType.charAt(0).toUpperCase() + jewelryType.slice(1).replace(/_/g, ' ');

      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Custom ${formattedType}`,
            description: customizationText || 'Handcrafted custom jewelry',
            images: item.preview_image_url ? [item.preview_image_url] : [],
            metadata: {
              jewelry_type: item.jewelry_type,
              customization_summary: customizationText,
              customization_data: JSON.stringify(item.customization_data || {}).slice(0, 500)
            }
          },
          unit_amount: Math.round(item.total_price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      };
    });

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/order-confirmation/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout?canceled=true`,
      customer_email: customerInfo.email,
      metadata: {
        customer_first_name: customerInfo.first_name || '',
        customer_last_name: customerInfo.last_name || '',
        customer_phone: customerInfo.phone || '',
        delivery_address: JSON.stringify(deliveryAddress),
        market,
        currency,
        subtotal: subtotal.toString(),
      },
      // Enable automatic tax calculation if needed in the future
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
