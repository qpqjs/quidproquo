import { describe, expect, it } from 'vitest';

import { createContextIdentifier } from './createContextIdentifier';

describe('createContextIdentifier', () => {
  it('returns an identifier with the name and default value', () => {
    expect(createContextIdentifier('user', { id: '1' })).toEqual({
      uniqueName: 'user',
      defaultValue: { id: '1' },
    });
  });

  it('does not mark the identifier as local', () => {
    expect(createContextIdentifier('user', null).local).toBeUndefined();
  });
});
