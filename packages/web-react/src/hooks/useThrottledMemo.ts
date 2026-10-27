import { useEffect, useRef, useState } from 'react';

export function useThrottledMemo<T>(factory: () => T, deps: any[], delaySeconds: number = 1): T {
  const [value, setValue] = useState(factory);
  const isFirstRun = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This skips the throttling on the initial mount
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValue(factory);
      timeoutRef.current = null;
    }, delaySeconds * 1000);

    // Cleanup on component unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // The dependency list is supplied by the caller, so it can't be statically
    // verified here — this hook is a throttled wrapper around useMemo semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delaySeconds]);

  return value;
}
