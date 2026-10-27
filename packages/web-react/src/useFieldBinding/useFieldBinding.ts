import { useEffect, useState } from 'react';

import { QpqRuntimeComputed } from '../runtime/createQpqRuntimeComputed';
import { useQpqRuntimeComputed } from '../runtime/useQpqRuntimeComputed';

export const useFieldBinding = <TState, V, E = any>(
  computedAtom: QpqRuntimeComputed<TState, V>,
  someSetter: (value: V) => Promise<void> | void,
  valueExtractor?: (event: E, ...args: any[]) => V,
): [V, (event: E, ...args: any[]) => void] => {
  const computedValue = useQpqRuntimeComputed(computedAtom);

  const [value, setValue] = useState<V>(computedValue);

  const handleChange = (event: E, ...args: any[]) => {
    const newValue: V = valueExtractor ? valueExtractor(event, ...args) : (event as any).target.value;
    setValue(newValue);
    someSetter(newValue);
  };

  useEffect(() => {
    // React bails out when the value is unchanged, so no equality guard is
    // needed — and local edits (which also change `value`) don't re-run this.
    setValue(computedValue);
  }, [computedValue]);

  return [value, handleChange];
};
