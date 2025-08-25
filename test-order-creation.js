// Test script to debug order creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcXh3dmFzY3F3aHFhb3FrcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM2NDcsImV4cCI6MjA2OTY1OTY0N30.v1xFg9m6qOv6fhT5Wp1f7TCdhp8KspOiXf8EUC2N8bE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOrderCreation() {
  console.log('🧪 Testing order creation...');
  
  try {
    const orderData = {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+961 70 123456',
      delivery_address: 'Test Address 123',
      delivery_city: 'Beirut',
      subtotal: 150.00,
      total: 150.00,
      customer_info: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '+961 70 123456'
      },
      delivery_address_json: {
        address: 'Test Address 123',
        city: 'Beirut',
        area: 'Test Area',
        building: 'Building 1',
        floor: '2nd Floor',
        notes: 'Test delivery notes'
      },
      items: [{
        jewelry_type: 'necklace',
        customization_data: { metal: 'yellow_gold', chain_type: 'yellow_gold_chain_real' },
        customization_summary: 'Yellow Gold Necklace',
        base_price: 100,
        total_price: 150,
        quantity: 1,
        subtotal: 150
      }],
      total_amount: 150
    };

    console.log('📋 Attempting to create order with data:', {
      customerName: orderData.customer_name,
      email: orderData.customer_email,
      subtotal: orderData.subtotal,
      itemsCount: orderData.items.length
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      return;
    }

    console.log('✅ Order created successfully:', order);

    // Test order items creation
    const orderItemsData = orderData.items.map(item => ({
      order_id: order.id,
      jewelry_type: item.jewelry_type,
      customization_data: item.customization_data,
      customization_summary: item.customization_summary,
      base_price: item.base_price,
      total_price: item.total_price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('❌ Order items creation failed:', itemsError);
      return;
    }

    console.log('✅ Order items created successfully');
    console.log('🎉 Full order creation test passed!');

    // Clean up test data
    await supabase.from('order_items').delete().eq('order_id', order.id);
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('🧹 Test data cleaned up');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testOrderCreation();
