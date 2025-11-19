# Stripe Integration Setup Guide

## Overview
Your Jove Jewelry store now has a complete Stripe integration that supports:
- **Multi-currency payments** (USD for Lebanon/International, AUD for Australia)
- **Market-based payment methods** (Cash on Delivery for Lebanon only, Stripe for all markets)
- **Automatic order creation** via Stripe webhooks
- **Secure checkout** with Stripe Checkout

## Environment Variables

### Required Variables (Already Set)
Add these to your `.env.local` file:

```bash
# Stripe Public Key (Frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Secret Key (Backend - DO NOT expose to frontend)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (Get this after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your site URL
NEXT_PUBLIC_URL=http://localhost:3000  # Change to your production URL

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Stripe Dashboard Setup

### 1. Get Your API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Copy your **Secret key** → `STRIPE_SECRET_KEY`

### 2. Setup Webhook Endpoint
1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - **Local testing**: Use [Stripe CLI](https://stripe.com/docs/stripe-cli) (see below)
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - ✅ `checkout.session.completed`
5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Local Testing with Stripe CLI

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows/Linux - see: https://stripe.com/docs/stripe-cli
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This command will output a webhook signing secret starting with `whsec_...` - add this to your `.env.local`.

## How It Works

### Payment Flow

#### For Stripe Payments (All Markets):
1. Customer fills out checkout form
2. Selects "Card Payment" method
3. Clicks "Proceed to Payment"
4. Redirected to Stripe Checkout (hosted by Stripe)
5. Enters card details and completes payment
6. Stripe webhook creates order in your database
7. Customer redirected to order confirmation page

#### For Cash on Delivery (Lebanon Only):
1. Customer fills out checkout form
2. Selects "Cash on Delivery" method
3. Clicks "Place Order"
4. Order created directly in database
5. Customer sees order confirmation

### Market-Specific Behavior

| Market | Currency | Payment Methods Available |
|--------|----------|--------------------------|
| **Lebanon** 🇱🇧 | USD | Cash on Delivery + Stripe |
| **International** 🌍 | USD | Stripe only |
| **Australia** 🇦🇺 | AUD | Stripe only |

### Files Created/Modified

#### New Files:
- `/src/app/api/create-checkout-session/route.ts` - Creates Stripe checkout sessions
- `/src/app/api/webhooks/stripe/route.ts` - Handles Stripe webhooks
- `/src/lib/stripe/client.ts` - Stripe.js client initialization
- `/src/hooks/useStripeCheckout.ts` - React hook for Stripe checkout

#### Modified Files:
- `/src/app/checkout/page.tsx` - Added payment method selection and Stripe integration
- `/src/lib/market-client.ts` - Added `paymentMethods` to market config

## Testing

### Test Card Numbers
Use these test cards in Stripe Checkout (test mode):

**Successful payment:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Payment requires authentication (3D Secure):**
```
Card: 4000 0025 0000 3155
```

**Declined payment:**
```
Card: 4000 0000 0000 0002
```

[Full list of test cards](https://stripe.com/docs/testing#cards)

### Testing Webhooks Locally

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Make a test payment and watch the webhook events in the Stripe CLI terminal

4. Check your database to confirm the order was created

## Production Deployment

### Vercel/Production Setup:

1. **Add environment variables** to your hosting platform (Vercel/etc.):
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_URL=https://yourdomain.com`

2. **Update webhook endpoint** in Stripe Dashboard:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select `checkout.session.completed` event
   - Copy the webhook signing secret to your environment variables

3. **Test in production** with test mode first before going live

### Going Live:

1. Switch from **test mode** to **live mode** in Stripe Dashboard
2. Get your **live** API keys
3. Update environment variables with **live** keys
4. Update webhook endpoint with **live** webhook secret
5. Test with a real card (will actually charge!)

## Security Notes

✅ **DO**:
- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secret (never commit to git)
- Use environment variables for all sensitive data
- Verify webhook signatures (already implemented)
- Use HTTPS in production

❌ **DON'T**:
- Expose secret keys in frontend code
- Skip webhook signature verification
- Use test keys in production

## Monitoring

Monitor your payments in the Stripe Dashboard:
- **Payments** - View all successful/failed payments
- **Customers** - See customer details
- **Logs** - Debug webhook deliveries
- **Disputes** - Handle chargebacks

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
