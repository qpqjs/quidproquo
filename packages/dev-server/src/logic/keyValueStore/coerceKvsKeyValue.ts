import { KvsKeyType } from 'quidproquo-core';

/**
 * Keys travel the repository interface as strings; the key columns hold real
 * types. Coerce back to the declared type so '42' finds pk 42.
 */
export const coerceKvsKeyValue = (value: string, keyType: KvsKeyType): string | number => (keyType === 'number' ? Number(value) : value);
