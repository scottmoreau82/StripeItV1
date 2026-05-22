import { useState, useEffect, useRef } from 'react';

export const useUpdateDetection = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const currentBuildTime = useRef<string | null>(null);

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch(
          `/version.json?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        
        if (!currentBuildTime.current) {
          currentBuildTime.current = data.buildTime;
          return;
        }
        
        if (data.buildTime !== currentBuildTime.current) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        // Silently fail — no network or file missing
      }
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { updateAvailable };
};
