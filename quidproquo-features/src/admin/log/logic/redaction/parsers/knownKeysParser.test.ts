import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { knownKeysParser } from './knownKeysParser';

describe('knownKeysParser', () => {
  it('redacts sweep keys and reports their values, at any depth and case', () => {
    const log = {
      correlation: 'c1',
      history: [{ act: { payload: { headers: { Authorization: 'Bearer abc', 'x-api-key': 'k1' } } }, res: { accessToken: 't1', id: 'keep' } }],
    } as any;

    const { redactedLog, redactions } = knownKeysParser(log);

    expect(redactedLog.history[0].act.payload.headers).toEqual({ Authorization: REDACTED_STRING, 'x-api-key': REDACTED_STRING });
    expect(redactedLog.history[0].res).toEqual({ accessToken: REDACTED_STRING, id: 'keep' });
    expect(redactions.sort()).toEqual(['Bearer abc', 'k1', 't1']);
  });

  it('redacts field-only keys without reporting them', () => {
    const log = { correlation: 'c1', input: [{ password: 'hunter2', username: 'joe' }] } as any;

    const { redactedLog, redactions } = knownKeysParser(log);

    expect(redactedLog.input).toEqual([{ password: REDACTED_STRING, username: 'joe' }]);
    expect(redactions).toEqual([]);
  });

  it('redacts an object under a sensitive key wholesale and reports every string inside', () => {
    const log = { correlation: 'c1', session: { token: { value: 'v1', kind: 'bearer' } } } as any;

    const { redactedLog, redactions } = knownKeysParser(log);

    expect((redactedLog.session as any).token).toEqual({ value: REDACTED_STRING, kind: REDACTED_STRING });
    expect(redactions.sort()).toEqual(['bearer', 'v1']);
  });

  it('never redacts ignored keys', () => {
    const log = { correlation: 'c1', input: [{ id: 'id1', pk: 'pk1', sk: 'sk1' }] } as any;

    expect(knownKeysParser(log).redactedLog.input).toEqual([{ id: 'id1', pk: 'pk1', sk: 'sk1' }]);
  });

  it('redacts keys inside json-string and base64 bodies and reports sweep values from them', () => {
    const body = { username: 'joe', password: 'hunter2', accessToken: 'tok-1' };
    const log = {
      correlation: 'c1',
      input: [{ body: Buffer.from(JSON.stringify(body)).toString('base64'), isBase64Encoded: true }],
      history: [{ act: { payload: { body: JSON.stringify(body) } }, res: [undefined, undefined] }],
    } as any;

    const { redactedLog, redactions } = knownKeysParser(log);

    const decoded = JSON.parse(Buffer.from(redactedLog.input[0].body, 'base64').toString());
    expect(decoded).toEqual({ username: 'joe', password: REDACTED_STRING, accessToken: REDACTED_STRING });
    expect(JSON.parse(redactedLog.history[0].act.payload.body)).toEqual({ username: 'joe', password: REDACTED_STRING, accessToken: REDACTED_STRING });
    expect(redactions).toEqual(['tok-1', 'tok-1']);
  });
});
