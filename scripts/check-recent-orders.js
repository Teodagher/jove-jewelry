/**
 * Check recent orders in Supabase database
 * This script verifies that Stripe webhook created orders successfully
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentOrders() {
    console.log('🔍 Checking recent orders in Supabase...\n');

    try {
        // Get the 5 most recent orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_email, total, payment_method, status, created_at, notes')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('❌ Error fetching orders:', error);
            return;
        }

        if (!orders || orders.length === 0) {
            console.log('📭 No orders found in database');
            return;
        }

        console.log(`✅ Found ${orders.length} recent order(s):\n`);

        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order #${order.order_number || order.id.slice(0, 8)}`);
            console.log(`   Customer: ${order.customer_name} (${order.customer_email})`);
            console.log(`   Total: $${order.total}`);
            console.log(`   Payment: ${order.payment_method}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);

            // Check if this is a Stripe order
            if (order.notes && order.notes.includes('Stripe Session:')) {
                const sessionMatch = order.notes.match(/Stripe Session: (cs_test_[^\s\n]+)/);
                if (sessionMatch) {
                    console.log(`   🔗 Stripe Session: ${sessionMatch[1]}`);
                }
            }
            console.log('');
        });

        // Get order items for the most recent order
        const mostRecentOrder = orders[0];
        console.log(`\n📦 Items for most recent order (${mostRecentOrder.order_number || mostRecentOrder.id.slice(0, 8)}):\n`);

        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', mostRecentOrder.id);

        if (itemsError) {
            console.error('❌ Error fetching order items:', itemsError);
            return;
        }

        if (!items || items.length === 0) {
            console.log('   No items found for this order');
            return;
        }

        items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.jewelry_type}`);
            console.log(`      Customization: ${item.customization_summary || 'N/A'}`);
            console.log(`      Price: $${item.total_price} x ${item.quantity} = $${item.subtotal}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkRecentOrders();
