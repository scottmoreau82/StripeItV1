import { useEffect } from 'react';

/**
 * Loads the Eruda mobile dev console for the developer account only.
 * No-ops for every other user — the script is never injected, the panel
 * never appears, and there is zero performance impact on real users.
 *
 * Once loaded, Eruda shows a floating gear/button on the page. Tap it
 * to open the console, network inspector, etc.
 */
export const useEruda = (isDeveloper: boolean) => {
  useEffect(() => {
    if (!isDeveloper) return;

    // Already loaded (e.g. hot-reload)
    if ((window as any).eruda) {
      (window as any).eruda.init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.async = true;
    script.onload = () => {
      try {
        (window as any).eruda.init();
        console.info('[Eruda] Dev console loaded — tap the floating button to open.');
      } catch (e) {
        console.warn('[Eruda] Init failed:', e);
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount: destroy the Eruda instance if it exists
      try { (window as any).eruda?.destroy(); } catch {}
    };
  }, [isDeveloper]);
};
