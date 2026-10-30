import { describe, expect, it } from 'vitest';

import { actionResult } from './actionResult';

describe('actionResult', () => {
  it('returns a single-element tuple with the result', () => {
    expect(actionResult('ok')).toEqual(['ok']);
  });
});
