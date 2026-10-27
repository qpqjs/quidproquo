import { DependencyList, useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function useEffectCallback<T extends Function>(callback: T, deps?: DependencyList): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<DependencyList | undefined>(deps);

  // If the deps have changed, update the callback ref
  // We support undefined deps, which means they are always updated
  // This is different to [] where its never updated.
  const hasDepsChanged = !depsRef.current || !deps || depsRef.current.some((dep, index) => dep !== deps[index]);
  if (hasDepsChanged) {
    callbackRef.current = callback;
  }

  depsRef.current = deps;

  const memoFunc = useCallback((...args: any[]) => callbackRef.current(...args), []);

  return memoFunc as unknown as T;
}
