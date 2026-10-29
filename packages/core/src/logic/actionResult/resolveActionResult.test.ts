import { describe, expect, it } from 'vitest';

import { resolveActionResult } from './resolveActionResult';

describe('resolveActionResult', () => {
  it('returns the first element of the tuple', () => {
    expect(resolveActionResult([{ a: 1 }])).toEqual({ a: 1 });
  });
});
