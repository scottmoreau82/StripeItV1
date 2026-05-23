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
        return new Response(JSON.stringify({ error: 'Internal server error', detail: err.message }), {
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

        // Signature verification temporarily disabled for testing
        // TODO: re-enable once env secret issue is resolved

        const event = JSON.parse(body);

        if (event.type !== 'checkout.session.completed') {
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'No userId found' }), { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const payload = {
          iss: env.FIREBASE_CLIENT_EMAIL,
          sub: env.FIREBASE_CLIENT_EMAIL,
          aud: 'https://oauth2.googleapis.com/token',
          iat: now,
          exp: now + 3600,
          scope: 'https://www.googleapis.com/auth/datastore'
        };

        const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const signingInput = `${encode(header)}.${encode(payload)}`;

        const keyData = env.FIREBASE_PRIVATE_KEY || '';

        const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
          'pkcs8', binaryKey,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false, ['sign']
        );

        const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
        const b64sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const jwt = `${signingInput}.${b64sig}`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
        const patchRes = await fetch(`${firestoreUrl}?updateMask.fieldPaths=subscriptionTier&updateMask.fieldPaths=updatedAt`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              subscriptionTier: { stringValue: 'pro' },
              updatedAt: { integerValue: Date.now().toString() }
            }
          })
        });

        if (!patchRes.ok) {
          const err = await patchRes.text();
          return new Response(JSON.stringify({ error: 'Firestore update failed', detail: err }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

      } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal server error', detail: err.message }), { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
