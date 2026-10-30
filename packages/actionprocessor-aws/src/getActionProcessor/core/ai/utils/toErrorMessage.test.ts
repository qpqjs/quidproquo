import { describe, expect, it } from 'vitest';

import { toErrorMessage } from './toErrorMessage';

describe('toErrorMessage', () => {
  it('returns the message of an Error', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a string error unchanged', () => {
    expect(toErrorMessage('plain')).toBe('plain');
  });

  it('JSON stringifies anything else', () => {
    expect(toErrorMessage({ code: 42 })).toBe('{"code":42}');
  });
});
