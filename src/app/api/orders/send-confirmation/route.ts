import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmails } from '@/lib/email/order-confirmation';

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        console.log(`[AutoConfirmAPI] Triggering confirmation for COD order: ${orderId}`);

        // Trigger the confirmation emails
        const result = await sendOrderConfirmationEmails(orderId);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[AutoConfirmAPI] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
