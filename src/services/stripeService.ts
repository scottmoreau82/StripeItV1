const WORKER_URL = 'https://stripeit.scottmoreau82.workers.dev';

export const stripeService = {
  async createCheckoutSession(userId: string, email: string): Promise<void> {
    const response = await fetch(`${WORKER_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    if (!url) {
      throw new Error('No checkout URL returned');
    }

    window.location.href = url;
  },
};
