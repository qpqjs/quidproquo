import { describe, expect, it } from 'vitest';

import { getSuccessfulEitherActionResult } from './getSuccessfulEitherActionResult';

describe('getSuccessfulEitherActionResult', () => {
  it('wraps a value as a successful result', () => {
    expect(getSuccessfulEitherActionResult(42)).toEqual({ success: true, result: 42 });
  });
});
