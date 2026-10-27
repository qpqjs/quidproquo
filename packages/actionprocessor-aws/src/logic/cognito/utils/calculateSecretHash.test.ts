import { describe, expect, it } from 'vitest';

import { calculateSecretHash } from './calculateSecretHash';

describe('calculateSecretHash', () => {
  it('returns the base64 HMAC-SHA256 of username+clientId keyed by the client secret', () => {
    expect(calculateSecretHash('alice', 'client123', 'secret')).toBe('oKHO337pkuh1r3zUNCZ1oCL3YgM0Yi2nkcAZsKQTIH8=');
  });

  it('is deterministic for the same inputs', () => {
    expect(calculateSecretHash('bob', 'client123', 'secret')).toBe(calculateSecretHash('bob', 'client123', 'secret'));
  });
});
