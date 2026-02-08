import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendOrderConfirmationEmails } from '@/lib/email/order-confirmation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check admin auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await (supabase
      .from('users') as any)
      .select('roles')
      .eq('auth_user_id', user.id)
      .single() as { data: { roles: string[] | null } | null }

    if (!userData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Send order confirmation emails
    const result = await sendOrderConfirmationEmails(orderId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send emails' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Order confirmation emails sent' })
  } catch (error: any) {
    console.error('[Resend Email] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}