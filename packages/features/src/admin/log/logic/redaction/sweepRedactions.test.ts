import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from './constants/REDACTED_STRING';
import { sweepRedactions } from './sweepRedactions';

describe('sweepRedactions', () => {
  it('replaces every occurrence of each value as a substring in every string leaf', () => {
    const input = { headers: { authorization: 'Bearer tok123' }, url: 'https://x?token=tok123', list: ['tok123', 5] };

    expect(sweepRedactions(input, ['tok123'])).toEqual({
      headers: { authorization: `Bearer ${REDACTED_STRING}` },
      url: `https://x?token=${REDACTED_STRING}`,
      list: [REDACTED_STRING, 5],
    });
  });

  it('replaces longer values first so a contained value leaves no fragment', () => {
    expect(sweepRedactions({ a: 'abc-long-secret' }, ['abc', 'abc-long-secret'])).toEqual({ a: REDACTED_STRING });
  });

  it('skips values shorter than the minimum and duplicates', () => {
    expect(sweepRedactions({ a: 'a1 b2 abc' }, ['a1', 'abc', 'abc'])).toEqual({ a: `a1 b2 ${REDACTED_STRING}` });
  });

  it('escapes regex characters in values', () => {
    expect(sweepRedactions({ a: 'x (y.z)* w' }, ['(y.z)*'])).toEqual({ a: `x ${REDACTED_STRING} w` });
  });

  it('returns the input untouched when nothing is swept', () => {
    const input = { a: 'x' };

    expect(sweepRedactions(input, [])).toBe(input);
  });

  it('sweeps inside json-string and base64 json leaves', () => {
    const input = { json: JSON.stringify({ msg: 'pw is tok123' }), b64: Buffer.from(JSON.stringify({ t: 'tok123' })).toString('base64') };

    const result = sweepRedactions(input, ['tok123']);

    expect(JSON.parse(result.json)).toEqual({ msg: `pw is ${REDACTED_STRING}` });
    expect(JSON.parse(Buffer.from(result.b64, 'base64').toString())).toEqual({ t: REDACTED_STRING });
  });
});
