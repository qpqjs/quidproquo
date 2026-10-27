import { zipArrays } from 'quidproquo-core';

import { useMemo } from 'react';

export function useZipArrays<TLeft, TRight>(left: readonly TLeft[], right: readonly TRight[]): ReturnType<typeof zipArrays<TLeft, TRight>> {
  const arrays = useMemo(() => zipArrays(left, right), [left, right]);
  return arrays;
}
