import * as createCheckoutSession from './functions/api/create-checkout-session.js';
import * as webhook from './functions/api/webhook.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/create-checkout-session') {
      return createCheckoutSession.onRequestPost({ request, env, ctx });
    }

    if (url.pathname === '/api/webhook') {
      if (request.method === 'OPTIONS') {
        return webhook.onRequestOptions ? webhook.onRequestOptions({ request, env, ctx }) : new Response(null, { status: 204 });
      }
      return webhook.onRequestPost({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
