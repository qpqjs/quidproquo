import { Nullable } from 'quidproquo-core';

// What a tenant may register: the conservative RFC 5321 dot-atom subset, lower-cased so
// routing is case-insensitive the way mail delivery is. Null when it is not registrable.
const LOCAL_PART = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/;

/** The registrable form of a local part, or null when it is malformed. */
export const normaliseEmailLocalPart = (address: string): Nullable<string> => {
  const local = address.trim().toLowerCase().split('@')[0];

  return LOCAL_PART.test(local) && !local.includes('..') ? local : null;
};
