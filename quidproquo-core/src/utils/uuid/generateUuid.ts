/**
 * Generates a new random (version 4) UUID.
 *
 * This is the single place in quidproquo to mint a v4 UUID, so it works across
 * both backend and frontend packages with no external dependency.
 *
 * It prefers the native `crypto.randomUUID()` (Node 20+, and browsers in a
 * SECURE context: https or localhost). Browsers deliberately hide that method on
 * plain-http origins, which is exactly where a self-hosted app on a LAN ip lives
 * (e.g. http://192.168.x.x), so it falls back to assembling the same v4 layout
 * from `crypto.getRandomValues()`, which is available everywhere.
 *
 * @returns {string} A randomly generated v4 UUID, e.g. `109156be-c4fb-41ea-b1b4-efe1671c5836`.
 */
export function generateUuid(): string {
  // lib.dom types the global as always present; older runtimes (Node before 19,
  // some workers) don't expose it, so treat it as optional and fail loudly. No
  // Math.random() last resort: a guessable id is worse than no id.
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues !== 'function') {
    throw new Error('generateUuid: no Web Crypto API available in this environment');
  }

  return generateUuidFromRandomValues(cryptoApi);
}

// RFC 4122 v4 from 16 random bytes: version nibble 4 in byte 6, variant 10xx in byte 8.
export function generateUuidFromRandomValues(cryptoApi: Pick<Crypto, 'getRandomValues'>): string {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
