import { describe, expect, it } from 'vitest';

import { jwtParser } from './jwtParser';

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc_DEF-123';

describe('jwtParser', () => {
  it('reports every jwt found in any string, without modifying the log', () => {
    const log = {
      correlation: 'c1',
      history: [{ act: { payload: { cookie: `session=${jwt}; path=/` } }, res: [jwt, undefined] }],
      note: 'a.b.c',
    } as any;

    const { redactedLog, redactions } = jwtParser(log);

    expect(redactedLog).toBe(log);
    expect(redactions).toEqual([jwt, jwt]);
  });
});
