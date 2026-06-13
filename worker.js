function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyStripeSignature(body, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [key, val] = part.split('=');
    acc[key.trim()] = val;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];

  if (!timestamp || !signature) return false;

  // Reject replayed/stale webhooks (tolerance: 5 minutes), matching Stripe's recommendation.
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (!Number.isFinite(age) || age > 300 || age < -300) return false;

  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );

  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(expected, signature);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://stripeit.app',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { userId, email } = body;

        if (!userId || !email) {
          return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'mode': 'subscription',
            'line_items[0][price]': env.STRIPE_PRICE_ID,
            'line_items[0][quantity]': '1',
            'customer_email': email,
            'client_reference_id': userId,
            'success_url': 'https://stripeit.app/dashboard?upgrade=success',
            'cancel_url': 'https://stripeit.app/dashboard?upgrade=cancelled',
            'metadata[userId]': userId,
          }).toString(),
        });

        const session = await stripeResponse.json();

        if (!stripeResponse.ok) {
          return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({ url: session.url }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (err) {
        console.error('Checkout session error:', err && err.message);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    if (url.pathname === '/api/webhook' && request.method === 'POST') {
      try {
        const body = await request.text();
        const sigHeader = request.headers.get('stripe-signature');

        if (!sigHeader) {
          return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });
        }

        const isValid = await verifyStripeSignature(body, sigHeader, env.STRIPE_WEBHOOK_SECRET);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
        }

        const event = JSON.parse(body);

        if (event.type !== 'checkout.session.completed') {
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        const session = event.data.object;

        // Only grant access when payment actually succeeded. A completed checkout
        // session is not necessarily a paid one (e.g. async/delayed payment methods).
        if (session.payment_status && session.payment_status !== 'paid') {
          return new Response(JSON.stringify({ received: true, skipped: 'unpaid' }), { status: 200 });
        }

        const userId = session.metadata?.userId || session.client_reference_id;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'No userId found' }), { status: 400 });
        }

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0971954368/databases/ai-studio-3b04b2cf-73a0-487b-8a72-3bbb905999a6/documents/users/${userId}`;
        const patchRes = await fetch(`${firestoreUrl}?updateMask.fieldPaths=subscriptionTier&updateMask.fieldPaths=updatedAt&key=AIzaSyCxalpBsHXMbJD61Bs8u4Co7lthUq6jbr4`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              subscriptionTier: { stringValue: 'pro' },
              updatedAt: { integerValue: Date.now().toString() }
            }
          })
        });

        if (!patchRes.ok) {
          const err = await patchRes.text();
          console.error('Firestore update failed:', err);
          return new Response(JSON.stringify({ error: 'Firestore update failed' }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

      } catch (err) {
        console.error('Webhook error:', err && err.message);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};
