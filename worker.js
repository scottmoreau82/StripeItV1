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

    return new Response('Not found', { status: 404 });
  }
};
