import { afterEach, describe, expect, it, vi } from 'vitest';

import { unsafeDecodeJWTPayload } from './jwtUtils';

const segment = (value: string): string => Buffer.from(value).toString('base64url');
const encode = (payload: object): string => `header.${segment(JSON.stringify(payload))}.signature`;

describe('unsafeDecodeJWTPayload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('decodes the payload segment of a JWT', () => {
    expect(unsafeDecodeJWTPayload(encode({ sub: 'user-1', exp: 123 }))).toEqual({ sub: 'user-1', exp: 123 });
  });

  it('decodes payloads that use the url-safe base64 characters', () => {
    // '?>' and '~~~' encode to base64 containing '/' and '+', which base64url writes as '_' and '-'.
    const payload = { a: '?>?>', b: '~~~~' };
    expect(encode(payload)).toMatch(/[-_]/);
    expect(unsafeDecodeJWTPayload(encode(payload))).toEqual(payload);
  });

  const notJwts: [label: string, token: string | null | undefined][] = [
    ['an opaque token', '057efb5fb9ee5d6b42fe3a8c13f44fceadd418245f1a35f6676f48db26aa015e'],
    ['two parts', `header.${segment('{"sub":"x"}')}`],
    ['four parts', `a.${segment('{"sub":"x"}')}.c.d`],
    ['an empty payload', 'header..signature'],
    ['a payload that is not JSON', `header.${segment('not json')}.signature`],
    ['a payload that is not an object', `header.${segment('123')}.signature`],
    ['a payload that is an array', `header.${segment('[1,2]')}.signature`],
    ['a payload that is null', `header.${segment('null')}.signature`],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
  ];

  for (const [label, token] of notJwts) {
    it(`returns null for ${label}, without logging`, () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(unsafeDecodeJWTPayload(token)).toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });
  }
});
