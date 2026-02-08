import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
// removed manual email import

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2025-11-17.clover' });
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  return secret;
}

// Disable body parsing, need raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();

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

      // Create Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if order already exists for this session (idempotency)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingOrder) {
        console.log('Order already exists for session:', session.id, existingOrder);
        return NextResponse.json({ received: true, orderId: existingOrder.id });
      }

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

        let customizationData = {};
        try {
          if (productMetadata.customization_data) {
            customizationData = JSON.parse(productMetadata.customization_data);
          }
        } catch (e) {
          console.warn('Failed to parse customization_data from stripe metadata:', e);
        }

        return {
          jewelry_type: productMetadata.jewelry_type || 'jewelry',
          customization_data: customizationData,
          customization_summary:
            productMetadata.customization_summary || lineItem.description || '',
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

        // Link order to authenticated user account
        auth_user_id: metadata.auth_user_id || null,

        // Existing table structure
        customer_name: `${metadata.customer_first_name || ''} ${metadata.customer_last_name || ''
          }`.trim(),
        customer_email:
          session.customer_email || session.customer_details?.email || '',
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
        stripe_session_id: session.id,
        notes: `Stripe Session: ${session.id}${deliveryAddress.notes ? `\n${deliveryAddress.notes}` : ''
          }`,
        order_notes: deliveryAddress.notes || null,

        // Stripe metadata
        discount_code: null,
        discount_amount: session.total_details?.amount_discount
          ? session.total_details.amount_discount / 100
          : null,
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

      console.log('Order created successfully:', order);

      // Insert individual order items
      if (order && orderItems.length > 0) {
        const itemsToInsert = orderItems.map((item) => ({
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
