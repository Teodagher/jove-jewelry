import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    // Verify caller is admin
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check caller's admin role
    const { data: callerData, error: callerError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('auth_user_id', user.id)
      .single();

    if (callerError || !callerData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch orders with service_role (bypasses RLS)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          jewelry_type,
          customization_data,
          customization_summary,
          base_price,
          total_price,
          quantity,
          subtotal,
          preview_image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
