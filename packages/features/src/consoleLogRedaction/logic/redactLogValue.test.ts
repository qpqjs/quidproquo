import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../../admin/log/logic/redaction/constants/REDACTED_STRING';
import { UNREDACTABLE_LOG_VALUE } from '../constants/UNREDACTABLE_LOG_VALUE';
import { redactLogValue } from './redactLogValue';

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc_DEF-123';

describe('redactLogValue', () => {
  it('redacts known secret keys at any depth and sweeps sweep-key values from sibling strings', () => {
    const redacted = redactLogValue({ user: 'joe', nested: { password: 'hunter2', apiKey: 'key-9' }, note: 'typed hunter2 with key-9' });

    // password is a field-only key: blanked where it sits, never swept, since password values
    // are often ordinary words that would mangle the rest of the log.
    expect(redacted).toEqual({
      user: 'joe',
      nested: { password: REDACTED_STRING, apiKey: REDACTED_STRING },
      note: `typed hunter2 with ${REDACTED_STRING}`,
    });
  });

  it('redacts an authorization header and sweeps its full value from sibling strings', () => {
    const redacted = redactLogValue({ headers: { authorization: 'Bearer tok-abc', host: 'x' }, msg: 'sent Bearer tok-abc' }) as Record<string, any>;

    expect(redacted.headers).toEqual({ authorization: REDACTED_STRING, host: 'x' });
    expect(redacted.msg).toBe(`sent ${REDACTED_STRING}`);
  });

  it('sweeps a JWT out of a plain string', () => {
    expect(redactLogValue(`token was ${jwt} ok`)).toBe(`token was ${REDACTED_STRING} ok`);
  });

  it('leaves values with nothing secret in them unchanged', () => {
    expect(redactLogValue({ count: 3, ok: true, items: ['a', 'b'] })).toEqual({ count: 3, ok: true, items: ['a', 'b'] });
    expect(redactLogValue('plain')).toBe('plain');
    expect(redactLogValue(undefined)).toBeUndefined();
  });

  it('replaces a value it cannot clone', () => {
    expect(redactLogValue({ callback: () => {} })).toBe(UNREDACTABLE_LOG_VALUE);
  });
});
