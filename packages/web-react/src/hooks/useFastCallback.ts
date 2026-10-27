/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { DependencyList } from 'react';

import { useEffectCallback } from './useEffectCallback';

// depraecated: use useEffectCallback instead
export function useFastCallback<T extends Function>(callback: T, deps?: DependencyList): T {
  return useEffectCallback<T>(callback, deps);
}
