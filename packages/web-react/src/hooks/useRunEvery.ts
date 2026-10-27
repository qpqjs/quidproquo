import { useEffect, useRef, useState } from 'react';

import { useEffectCallback } from './useEffectCallback';

export function useRunEvery<T>(func: () => T, intervalSeconds: number): T {
  const [value, setValue] = useState<T>(func);
  const intervalRef = useRef<number | null>(null);

  // Stable identity so a caller passing a fresh arrow each render doesn't
  // tear down and recreate the interval.
  const stableFunc = useEffectCallback(func);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const newValue = stableFunc();
      setValue(newValue);
    }, intervalSeconds * 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalSeconds, stableFunc]);

  return value;
}
