import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { redactStoryResult } from '../redactStoryResult';
import { keyFragmentParser } from './keyFragmentParser';

describe('keyFragmentParser', () => {
  it('redacts any property whose name contains "secret", at any depth and case, and reports its value', () => {
    const log = {
      correlation: 'c1',
      history: [
        { act: { payload: { headers: { 'X-Webhook-Secret': 'wh-1' }, callbackSecret: 'cb-1' } }, res: { client_secret: 'cs-1', name: 'keep' } },
      ],
    } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(redactedLog.history[0].act.payload).toEqual({ headers: { 'X-Webhook-Secret': REDACTED_STRING }, callbackSecret: REDACTED_STRING });
    expect(redactedLog.history[0].res).toEqual({ client_secret: REDACTED_STRING, name: 'keep' });
    expect(redactions.sort()).toEqual(['cb-1', 'cs-1', 'wh-1']);
  });

  it('finds the key inside a form-encoded body, such as an OAuth token request', () => {
    const log = { correlation: 'c1', input: [{ body: 'grant_type=client_credentials&client_id=abc&client_secret=ca_super-secret-value' }] } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(redactions).toEqual(['ca_super-secret-value']);
    expect(redactedLog.input[0].body).not.toContain('ca_super-secret-value');
    expect(new URLSearchParams(redactedLog.input[0].body).get('client_id')).toBe('abc');
  });

  it('finds the key inside a json-string body', () => {
    const log = {
      correlation: 'c1',
      history: [{ act: { payload: { body: JSON.stringify({ appSecret: 'app-1', id: 'keep' }) } }, res: [undefined, undefined] }],
    } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(JSON.parse(redactedLog.history[0].act.payload.body)).toEqual({ appSecret: REDACTED_STRING, id: 'keep' });
    expect(redactions).toEqual(['app-1']);
  });

  it('redacts an object under a matching key wholesale and reports every string inside', () => {
    const log = { correlation: 'c1', input: [{ clientSecrets: [{ value: 'v1' }, { value: 'v2' }] }] } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(redactedLog.input[0].clientSecrets).toEqual([{ value: REDACTED_STRING }, { value: REDACTED_STRING }]);
    expect(redactions.sort()).toEqual(['v1', 'v2']);
  });

  it('leaves secretName and secretId readable: they name or identify a secret rather than holding one', () => {
    const log = {
      correlation: 'c1',
      history: [{ act: { payload: { secretName: 'db-password', secretId: '2294a78c-a16c-4e64-ab98-89bec610613a' } }, res: [undefined, undefined] }],
    } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(redactedLog.history[0].act.payload).toEqual({ secretName: 'db-password', secretId: '2294a78c-a16c-4e64-ab98-89bec610613a' });
    expect(redactions).toEqual([]);
  });

  it('redacts any property whose name contains "token" and reports its value', () => {
    const log = {
      correlation: 'c1',
      input: [{ body: JSON.stringify({ linkToken: 'link-1' }) }],
      history: [{ act: { payload: {} }, res: [{ sessionToken: 'sess-1', access_token: 'acc-1' }, undefined] }],
    } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect(JSON.parse(redactedLog.input[0].body)).toEqual({ linkToken: REDACTED_STRING });
    expect(redactedLog.history[0].res[0]).toEqual({ sessionToken: REDACTED_STRING, access_token: REDACTED_STRING });
    expect(redactions.sort()).toEqual(['acc-1', 'link-1', 'sess-1']);
  });

  it('leaves token names that hold no secret readable, and still checks inside them', () => {
    const log = {
      correlation: 'c1',
      session: { decodedAccessToken: { userId: 'u1', username: 'joe@example.com', exp: 0 } },
      input: [{ token_type: 'Bearer', tokenType: 'Bearer', tokenHash: 'abc123', decodedAccessToken: { nested: { clientSecret: 'cs-9' } } }],
    } as any;

    const { redactedLog, redactions } = keyFragmentParser(log);

    expect((redactedLog.session as any).decodedAccessToken).toEqual({ userId: 'u1', username: 'joe@example.com', exp: 0 });
    expect(redactedLog.input[0]).toEqual({
      token_type: 'Bearer',
      tokenType: 'Bearer',
      tokenHash: 'abc123',
      decodedAccessToken: { nested: { clientSecret: REDACTED_STRING } },
    });
    expect(redactions).toEqual(['cs-9']);
  });

  it('leaves keys without the fragment alone', () => {
    const log = { correlation: 'c1', input: [{ id: 'id1', name: 'n', secretive: undefined, sec: 's' }] } as any;

    expect(keyFragmentParser(log).redactedLog.input).toEqual([{ id: 'id1', name: 'n', secretive: undefined, sec: 's' }]);
  });

  it('through the pipeline, sweeps the value from everywhere else in the log', () => {
    const log = {
      correlation: 'c1',
      input: [{ body: 'grant_type=client_credentials&client_id=abc&client_secret=ca_leaky-value' }],
      history: [{ act: { type: 'Log/Create', payload: { msg: 'exchanging ca_leaky-value for a token' } }, res: [undefined, undefined] }],
    } as any;

    expect(JSON.stringify(redactStoryResult(log))).not.toContain('ca_leaky-value');
  });
});
