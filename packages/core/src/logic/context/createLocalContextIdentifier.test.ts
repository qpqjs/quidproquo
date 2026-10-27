import { describe, expect, it } from 'vitest';

import { createLocalContextIdentifier } from './createLocalContextIdentifier';

describe('createLocalContextIdentifier', () => {
  it('returns an identifier flagged as local', () => {
    expect(createLocalContextIdentifier('session', 'none')).toEqual({
      uniqueName: 'session',
      defaultValue: 'none',
      local: true,
    });
  });
});
