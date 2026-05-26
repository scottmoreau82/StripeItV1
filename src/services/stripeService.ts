const WORKER_URL = 'https://stripeit.scottmoreau82.workers.dev';

export const stripeService = {
  async createCheckoutSession(userId: string, email: string): Promise<void> {
    try {
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
    } catch (err: any) {
      console.warn('Worker checkout session failed, using secure fallback link:', err);
      // Fallback checkout link in case worker has connection or CORS issues in the iframe
      const fallbackUrl = `https://buy.stripe.com/test_fZu3cu0St7Hk7EDgXq1kA00?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(email || '')}`;
      window.location.href = fallbackUrl;
    }
  },
};

