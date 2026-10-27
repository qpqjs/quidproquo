import { sha1 } from '../hash/sha1';

// The well-known namespace UUIDs from RFC 4122 Appendix C.
export enum UuidNamespace {
  dns = '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url = '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid = '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500 = '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
}

const uuidFormatRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Raised when the namespace argument is not a canonical UUID string.
export enum InvalidUuidNamespaceErrorCode {
  notAUuid = 'notAUuid',
}

export class InvalidUuidNamespaceError extends Error {
  constructor(
    public readonly code: InvalidUuidNamespaceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidUuidNamespaceError';
  }
}

const uuidToBytes = (uuid: string): Uint8Array => {
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);

  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
};

const bytesToUuid = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

/**
 * Generates a deterministic name-based (version 5) UUID - the sister of `generateUuid`.
 *
 * Where `generateUuid` mints a random v4 UUID, this derives a UUID from a name and a
 * namespace UUID per RFC 4122: the same inputs always produce the same UUID, so it is
 * useful for stable identifiers (e.g. mapping an external key to a UUID). It hashes with
 * the bundled pure-TypeScript SHA-1 so it stays synchronous and dependency-free in both
 * Node and browsers.
 *
 * @param {string} name - The name to derive the UUID from.
 * @param {string} namespace - The namespace UUID, e.g. `UuidNamespace.dns` or any UUID of your own.
 * @returns {string} The derived v5 UUID, e.g. `2ed6657d-e927-568b-95e1-2665a8aea6a2`.
 */
export function generateUuidV5(name: string, namespace: string): string {
  if (!uuidFormatRegex.test(namespace)) {
    throw new InvalidUuidNamespaceError(InvalidUuidNamespaceErrorCode.notAUuid, `Invalid namespace UUID [${namespace}]`);
  }

  const namespaceBytes = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);

  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes);
  input.set(nameBytes, namespaceBytes.length);

  const bytes = sha1(input).slice(0, 16);

  // RFC 4122: the high nibble of byte 6 carries the version, the top bits of byte 8 the variant.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}
