import { describe, expect, it } from 'vitest';

import { normaliseEmailLocalPart } from './normaliseEmailLocalPart';

describe('normaliseEmailLocalPart', () => {
  it('lower-cases, trims and drops a host the caller included', () => {
    expect(normaliseEmailLocalPart(' Finance.CommBank@inbox.example.com ')).toBe('finance.commbank');
  });

  it('refuses shapes mail delivery would not accept', () => {
    expect(normaliseEmailLocalPart('')).toBeNull();
    expect(normaliseEmailLocalPart('.leading')).toBeNull();
    expect(normaliseEmailLocalPart('double..dot')).toBeNull();
    expect(normaliseEmailLocalPart('has space')).toBeNull();
    expect(normaliseEmailLocalPart('a'.repeat(65))).toBeNull();
  });
});
