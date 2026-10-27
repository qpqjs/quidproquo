import { Lookup } from '../../types/Lookup';
import { getLookupValues } from './getLookupValues';

export function resolveLookupValues<T extends Record<string, any>>(lookups: Lookup<T>[], enumObj: T): Array<T[keyof T]> {
  const allValidKeys = getLookupValues(enumObj).filter((l) => l !== 'All');

  // Use all, or just the ones that are in there...
  const keys = lookups.includes('All') ? allValidKeys : lookups;

  // Only use keys that are in the enum
  const validKeys = allValidKeys.filter((key) => keys.includes(key));

  return validKeys.map((k) => enumObj[k]);
}
