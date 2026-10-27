import { DependencyList, useEffect } from 'react';

export const useAsyncEffect = (effect: (isMounted: () => boolean) => Promise<void | (() => void)>, deps?: DependencyList): void => {
  useEffect(() => {
    const mountStatus = { mounted: true };

    const runEffect = async () => {
      try {
        return await effect(() => mountStatus.mounted);
      } catch (error) {
        console.error('Error in useAsyncEffect:', error);
      }
    };

    const result = runEffect();

    return () => {
      mountStatus.mounted = false;

      result.then((callback) => {
        if (callback) {
          callback();
        }
      });
    };
    // The dependency list is supplied by the caller, so it can't be statically
    // verified here — this hook is a passthrough wrapper around useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
