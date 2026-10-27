import { describe, expect, it } from 'vitest';

import { composeScopedKvsIndexValue, getScopedKvsIndexAttributeName, stripScopedKvsIndexAttributes } from './scopedKvsIndexAttribute';

describe('scoped index attributes', () => {
  it('names the hidden copy with the reserved marker', () => {
    expect(getScopedKvsIndexAttributeName('customerId')).toBe('@@QPQGSI_customerId@@');
  });

  it('composes the scope into a string value, numbers included', () => {
    expect(composeScopedKvsIndexValue('scope-a', 'c-9')).toBe('scope-a@@QPQSCOPE@@c-9');
    expect(composeScopedKvsIndexValue('scope-a', 3)).toBe('scope-a@@QPQSCOPE@@3');
  });

  it('strips every reserved-marker attribute and returns the item itself when there is none', () => {
    const plain = { id: 'o-1' };

    expect(stripScopedKvsIndexAttributes({ id: 'o-1', level: 3, '@@QPQGSI_level@@': 's@@QPQSCOPE@@3' })).toEqual({ id: 'o-1', level: 3 });
    expect(stripScopedKvsIndexAttributes(plain)).toBe(plain);
  });
});
