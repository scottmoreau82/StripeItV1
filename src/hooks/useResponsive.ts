import { useState, useEffect } from 'react';

/**
 * StripeItResponsiveSystem
 * Shared responsive architecture for real-time viewport detection.
 *
 * Width is read from document.documentElement.clientWidth (the LAYOUT viewport)
 * rather than window.innerWidth. On iOS Safari, pinch-zoom changes the visual
 * viewport and can momentarily report a smaller innerWidth, which would wrongly
 * trip the mobile breakpoint and sometimes fail to recover on zoom-out. clientWidth
 * is unaffected by pinch-zoom, so the layout stays stable while zooming.
 */
export function useResponsive() {
  const getWidth = () =>
    document.documentElement?.clientWidth || window.innerWidth;

  const [isMobile, setIsMobile] = useState(() => getWidth() < 768);
  const [isTablet, setIsTablet] = useState(() => {
    const w = getWidth();
    return w >= 768 && w < 1024;
  });
  const [isDesktop, setIsDesktop] = useState(() => getWidth() >= 1024);

  useEffect(() => {
    const checkSize = () => {
      const width = getWidth();
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    window.addEventListener('orientationchange', checkSize);
    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('orientationchange', checkSize);
    };
  }, []);

  return { isMobile, isTablet, isDesktop };
}
