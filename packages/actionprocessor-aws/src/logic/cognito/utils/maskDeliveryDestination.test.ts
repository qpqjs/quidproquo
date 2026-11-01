import { describe, expect, it } from 'vitest';

import { maskDeliveryDestination } from './maskDeliveryDestination';

describe('maskDeliveryDestination', () => {
  it('masks an email to its first local and domain letters', () => {
    expect(maskDeliveryDestination('joe@example.com')).toBe('j***@e***');
  });

  // Security regression: an alias username must still answer the email shape a real alias account would, so the
  // presence of a domain never reveals whether the account exists.
  it('answers the full email shape for a username with no domain', () => {
    expect(maskDeliveryDestination('joe')).toMatch(/^j\*\*\*@[a-z]\*\*\*$/);
  });

  it('derives the same domain letter for the same alias every time', () => {
    expect(maskDeliveryDestination('joe')).toBe(maskDeliveryDestination('joe'));
    expect(maskDeliveryDestination('joe')).not.toBe(maskDeliveryDestination('ann'));
  });
});
