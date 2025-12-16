import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !supabase) {
      return NextResponse.json(
        { error: 'Stripe or Supabase not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Processing completed checkout session:', session.id);

      // Retrieve full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price.product'],
      });

      const metadata = session.metadata || {};
      const deliveryAddress = metadata.delivery_address
        ? JSON.parse(metadata.delivery_address)
        : {};

      // Create order items from line items
      const orderItems = (fullSession.line_items?.data || []).map((lineItem) => {
        const product = lineItem.price?.product as Stripe.Product;
        const productMetadata = product?.metadata || {};

        return {
          jewelry_type: productMetadata.jewelry_type || 'jewelry',
          customization_data: {}, // We can't reconstruct this from Stripe, stored in metadata if needed
          customization_summary: productMetadata.customization_summary || lineItem.description || '',
          base_price: (lineItem.amount_total || 0) / 100, // Convert from cents
          total_price: (lineItem.amount_total || 0) / 100,
          quantity: lineItem.quantity || 1,
          subtotal: (lineItem.amount_total || 0) / 100,
          preview_image_url: product?.images?.[0] || null,
        };
      });

      // Create order in database
      const orderData = {
        // New JSON structure
        customer_info: {
          first_name: metadata.customer_first_name || '',
          last_name: metadata.customer_last_name || '',
          email: session.customer_email || session.customer_details?.email || '',
          phone: metadata.customer_phone || '',
        },
        delivery_address_json: deliveryAddress,
        items: orderItems,
        total_amount: (session.amount_total || 0) / 100,

        // Existing table structure
        customer_name: `${metadata.customer_first_name || ''} ${metadata.customer_last_name || ''}`.trim(),
        customer_email: session.customer_email || session.customer_details?.email || '',
        customer_phone: metadata.customer_phone || '',
        delivery_address: deliveryAddress.address || '',
        delivery_city: deliveryAddress.city || '',
        delivery_postal_code: null,
        delivery_notes: deliveryAddress.notes || null,
        delivery_latitude: deliveryAddress.latitude || null,
        delivery_longitude: deliveryAddress.longitude || null,
        subtotal: parseFloat(metadata.subtotal || '0'),
        total: (session.amount_total || 0) / 100,
        payment_method: 'stripe',
        status: session.payment_status === 'paid' ? 'paid' : 'pending',
        notes: deliveryAddress.notes || null,
        order_notes: deliveryAddress.notes || null,

        // Promo code data from metadata
        discount_code: metadata.promo_code || null,
        discount_type: metadata.discount_type || null,
        discount_value: metadata.discount_value ? parseFloat(metadata.discount_value) : null,
        discount_amount: session.total_details?.amount_discount
          ? (session.total_details.amount_discount / 100)
          : (metadata.discount_amount ? parseFloat(metadata.discount_amount) : null),
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id, order_number')
        .single();

      if (orderError) {
        console.error('Failed to create order from webhook:', orderError);
        throw orderError;
      }

      // Record promo code usage if promo code was used
      if (metadata.promo_code_id && order) {
        try {
          // Fetch promo code details to get payout settings
          const { data: promoCodeData } = await supabase
            .from('promo_codes')
            .select('influencer_payout_type, influencer_payout_value')
            .eq('id', metadata.promo_code_id)
            .single();

          // Calculate influencer payout
          let influencerPayout = 0;
          if (promoCodeData) {
            const { influencer_payout_type, influencer_payout_value } = promoCodeData;
            const orderTotal = (session.amount_total || 0) / 100;

            if (influencer_payout_type === 'percentage_of_sale' && influencer_payout_value) {
              influencerPayout = (orderTotal * influencer_payout_value) / 100;
            } else if (influencer_payout_type === 'fixed' && influencer_payout_value) {
              influencerPayout = influencer_payout_value;
            }
          }

          await supabase.from('promo_code_usage').insert({
            promo_code_id: metadata.promo_code_id,
            order_id: order.id,
            customer_email: session.customer_email || session.customer_details?.email || '',
            discount_amount: session.total_details?.amount_discount
              ? (session.total_details.amount_discount / 100)
              : (metadata.discount_amount ? parseFloat(metadata.discount_amount) : 0),
            order_subtotal: parseFloat(metadata.subtotal || '0'),
            order_total: (session.amount_total || 0) / 100,
            influencer_payout_amount: influencerPayout,
            payout_status: 'calculated',
          });

          // Increment promo code usage counter
          await supabase
            .from('promo_codes')
            .update({ current_uses: (supabase as any).raw('current_uses + 1') })
            .eq('id', metadata.promo_code_id);

          console.log('✅ Promo code usage recorded with payout:', influencerPayout);
        } catch (error) {
          console.error('Failed to record promo code usage:', error);
          // Don't fail the webhook for this
        }
      }
      console.log('Order created successfully:', order);

      // Insert individual order items
      if (order && orderItems.length > 0) {
        const itemsToInsert = orderItems.map(item => ({
          ...item,
          order_id: order.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Failed to insert order items:', itemsError);
          // Don't throw - order is already created
        }
      }

      // Store Stripe session ID for reference
      await supabase
        .from('orders')
        .update({
          stripe_session_id: session.id,
          notes: orderData.notes // Keep original notes if any
        })
        .eq('id', order.id);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
