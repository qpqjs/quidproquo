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

  // Security regression: only the ascii dot-atom subset is registrable, so lookalike unicode, quoting, control
  // characters, separators and the scope marker can never become an inbox key or collide with another tenant's.
  it.each(['fin\u0430nce', 'caf\u00e9', '"quoted"', 'a\r\nb', 'back\\slash', 'a/b', '+leading', 'trailing-', 'a\u0000b', 'İnbox'])(
    'refuses the lookalike or control-character local part %j',
    (address) => {
      expect(normaliseEmailLocalPart(address)).toBeNull();
    },
  );

  it('keeps plus tags and dots inside the name and folds case so routing matches delivery', () => {
    expect(normaliseEmailLocalPart('Team+Billing.2026@inbox.example.com')).toBe('team+billing.2026');
    expect(normaliseEmailLocalPart('TEAM+billing.2026')).toBe(normaliseEmailLocalPart('team+BILLING.2026'));
  });
});
