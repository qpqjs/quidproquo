import { CryptoContext } from 'quidproquo-core';

// Netstring-style encoding (byteLength:value) so { ab: 'c' } and { a: 'bc' }
// cannot canonicalize to the same bytes.
const encodePart = (part: string): string => `${Buffer.byteLength(part, 'utf8')}:${part}`;

// Deterministic byte encoding of a crypto context, used as the AAD for
// envelope encryption. Keys are sorted by code unit (NOT localeCompare, which
// varies by environment). undefined and {} are equivalent: both canonicalize
// to the empty string. Every runtime (prod KMS, dev stub) MUST canonicalize
// through this one function, or dev and prod disagree about what a valid
// context is and it only surfaces after deploy.
export const canonicalizeCryptoContext = (context?: CryptoContext): string => {
  const sortedEntries = Object.entries(context || {}).sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0));

  return sortedEntries.map(([key, value]) => encodePart(key) + encodePart(value)).join('');
};
