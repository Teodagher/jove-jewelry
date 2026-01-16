import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface OrderItem {
  id: string;
  jewelry_name: string;
  quantity: number;
  unit_price: number;
  customizations: Record<string, string>;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  created_at: string;
  items: OrderItem[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    const order: Order = {
      id: orderData.id,
      order_number: orderData.order_number || orderData.id.slice(0, 8).toUpperCase(),
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone || '',
      shipping_address: orderData.shipping_address || '',
      total: orderData.total,
      subtotal: orderData.subtotal || orderData.total,
      shipping_cost: orderData.shipping_cost || 0,
      created_at: orderData.created_at,
      items: (itemsData || []).map((item: any) => ({
        id: item.id,
        jewelry_name: item.jewelry_name || item.product_name || 'Custom Jewellery',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
        customizations: item.customizations || item.options || {}
      }))
    };

    // Generate HTML invoice
    const invoiceHtml = generateInvoiceHtml(order);

    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

function generateInvoiceHtml(order: Order): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatCustomizations = (customizations: Record<string, string>) => {
    return Object.entries(customizations)
      .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
      .join('<br>');
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - Maison Jové - #${order.order_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-weight: 300;
      color: #1a1a1a;
      background: #faf8f5;
      line-height: 1.6;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px;
      background: #fff;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 60px;
      padding-bottom: 30px;
      border-bottom: 1px solid #ebe6df;
    }
    
    .logo h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 0.15em;
      color: #0a0a0a;
      margin-bottom: 4px;
    }
    
    .logo p {
      font-size: 10px;
      letter-spacing: 0.25em;
      color: #666;
      text-transform: uppercase;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      font-weight: 300;
      color: #0a0a0a;
      margin-bottom: 8px;
    }
    
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    
    .detail-section h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #b8a06a;
      margin-bottom: 12px;
      font-weight: 500;
    }
    
    .detail-section p {
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    
    .items-table th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #666;
      font-weight: 500;
      text-align: left;
      padding: 12px 0;
      border-bottom: 1px solid #ebe6df;
    }
    
    .items-table th:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 20px 0;
      border-bottom: 1px solid #f5f2ed;
      vertical-align: top;
    }
    
    .items-table td:last-child {
      text-align: right;
    }
    
    .item-name {
      font-weight: 400;
      margin-bottom: 8px;
    }
    
    .item-specs {
      font-size: 12px;
      color: #666;
      line-height: 1.8;
    }
    
    .totals {
      margin-left: auto;
      width: 280px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .total-row.grand-total {
      border-top: 1px solid #ebe6df;
      margin-top: 12px;
      padding-top: 16px;
      font-size: 18px;
      font-weight: 400;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #ebe6df;
      text-align: center;
    }
    
    .footer-brand {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      font-weight: 300;
      letter-spacing: 0.1em;
      color: #0a0a0a;
      margin-bottom: 12px;
    }
    
    .footer-contact {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .footer-note {
      font-size: 11px;
      color: #999;
      margin-top: 20px;
    }
    
    @media print {
      body {
        background: #fff;
      }
      .invoice {
        padding: 40px;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">
        <h1>MAISON JOVÉ</h1>
        <p>Fine Jewellery</p>
      </div>
      <div class="invoice-title">
        <h2>Tax Invoice</h2>
        <p class="invoice-number">#${order.order_number}</p>
      </div>
    </div>
    
    <div class="details-grid">
      <div class="detail-section">
        <h3>Bill To</h3>
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.customer_email}</p>
        ${order.customer_phone ? `<p>${order.customer_phone}</p>` : ''}
        ${order.shipping_address ? `<p>${order.shipping_address}</p>` : ''}
      </div>
      <div class="detail-section">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
        <p><strong>Order ID:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>
              <div class="item-name">${item.jewelry_name}</div>
              ${Object.keys(item.customizations).length > 0 ? `
                <div class="item-specs">${formatCustomizations(item.customizations)}</div>
              ` : ''}
            </td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.unit_price)}</td>
            <td>${formatPrice(item.unit_price * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatPrice(order.subtotal)}</span>
      </div>
      ${order.shipping_cost > 0 ? `
        <div class="total-row">
          <span>Shipping</span>
          <span>${formatPrice(order.shipping_cost)}</span>
        </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>Total</span>
        <span>${formatPrice(order.total)}</span>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-brand">MAISON JOVÉ</p>
      <p class="footer-contact">support@maisonjove.com</p>
      <p class="footer-contact">+961 71 777 422</p>
      <p class="footer-note">Thank you for choosing Maison Jové. Each piece is handcrafted with exceptional care.</p>
    </div>
  </div>
</body>
</html>
  `;
}
