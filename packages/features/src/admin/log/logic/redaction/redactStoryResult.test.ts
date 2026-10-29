import { ConfigActionType, CryptoActionType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from './constants/REDACTED_STRING';
import { redactStoryResult } from './redactStoryResult';

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc_DEF-123';

const storyResult = {
  correlation: 'mod::abc',
  moduleName: 'mod',
  startedAt: '2026-09-16T00:00:00.000Z',
  tags: ['tag'],
  input: [{ body: Buffer.from(JSON.stringify({ username: 'joe', password: 'hunter2', apiKey: 'key-9' })).toString('base64'), isBase64Encoded: true }],
  session: { accessToken: 'tok-abc' },
  history: [
    {
      act: { type: 'Network/Request', payload: { url: 'https://x?token=tok-abc', headers: { cookie: `s=${jwt}` } } },
      res: [{ body: `echo ${jwt}` }, undefined],
    },
    { act: { type: 'Log/Create', payload: { msg: 'user joe typed hunter2 with tok-abc and plain-pt and key-9' } }, res: [undefined, undefined] },
    { act: { type: CryptoActionType.Encrypt, payload: { keyName: 'k', plaintext: 'plain-pt' } }, res: ['cipher', undefined] },
    { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'db' } }, res: ['{"user":"dbuser","pass":"db-pass-123"}', undefined] },
    { act: { type: 'Network/Request', payload: { url: 'postgres://dbuser:db-pass-123@host' } }, res: [undefined, undefined] },
  ],
} as any;

describe('redactStoryResult', () => {
  it('runs every parser then sweeps reported values from every string', () => {
    const redacted = redactStoryResult(storyResult);

    expect(redacted.correlation).toBe('mod::abc');
    expect(redacted.tags).toEqual(['tag']);
    expect(JSON.parse(Buffer.from(redacted.input[0].body, 'base64').toString())).toEqual({
      username: 'joe',
      password: REDACTED_STRING,
      apiKey: REDACTED_STRING,
    });
    expect(redacted.session).toEqual({ accessToken: REDACTED_STRING });
    expect(redacted!.history[0]!.act.payload).toEqual({ url: `https://x?token=${REDACTED_STRING}`, headers: { cookie: REDACTED_STRING } });
    expect(redacted!.history[0]!.res).toEqual([{ body: `echo ${REDACTED_STRING}` }, undefined]);
    expect(redacted!.history[1]!.act.payload.msg).toBe(
      `user joe typed hunter2 with ${REDACTED_STRING} and ${REDACTED_STRING} and ${REDACTED_STRING}`,
    );
    expect(redacted!.history[2]!.act.payload).toEqual({ keyName: REDACTED_STRING, plaintext: REDACTED_STRING });
    expect(redacted!.history[2]!.res).toEqual(['cipher', undefined]);
    expect(redacted!.history[3]!.res).toEqual([REDACTED_STRING, undefined]);
    expect(redacted!.history[4]!.act.payload.url).toBe(`postgres://${REDACTED_STRING}:${REDACTED_STRING}@host`);
  });

  it('sweeps a Basic auth password from the whole log, keeping the client id', () => {
    const basic = Buffer.from('client-1:ca_secret-123').toString('base64');
    const redacted = redactStoryResult({
      ...storyResult,
      input: [{ headers: { Authorization: `Basic ${basic}` } }],
      history: [{ act: { type: 'Log/Create', payload: { msg: 'client-1 sent ca_secret-123' } }, res: [undefined, undefined] }],
    });

    expect(redacted.input[0].headers.Authorization).toBe(REDACTED_STRING);
    expect(redacted!.history[0]!.act.payload.msg).toBe(`client-1 sent ${REDACTED_STRING}`);
  });

  // Security regression: the custom auth challenge answer sits in the createAuthChallenge result
  // (privateChallengeParameters) and the user's reply in the verifyAuthChallenge input (challengeAnswer);
  // an admin reading those logs must never see a one-time code that may still be live.
  it('redacts the private challenge parameters and the challenge answer of custom auth logs', () => {
    const redacted = redactStoryResult({
      ...storyResult,
      input: [{ challengeAnswer: { code: '482913' }, privateChallengeParameters: { answer: '482913' }, userAttributes: { email: 'a@b.com' } }],
      history: [
        {
          act: { type: 'Log/Create', payload: { msg: 'issuing code' } },
          res: [
            { challengeName: 'emailCode', privateChallengeParameters: { answer: '482913' }, publicChallengeParameters: { hint: 'check your inbox' } },
            undefined,
          ],
        },
      ],
    });

    expect(redacted.input[0]).toEqual({
      challengeAnswer: { code: REDACTED_STRING },
      privateChallengeParameters: { answer: REDACTED_STRING },
      userAttributes: { email: 'a@b.com' },
    });
    expect(redacted!.history[0]!.res[0]).toEqual({
      challengeName: 'emailCode',
      privateChallengeParameters: { answer: REDACTED_STRING },
      publicChallengeParameters: { hint: 'check your inbox' },
    });
  });

  it('does not mutate the input', () => {
    const before = JSON.stringify(storyResult);

    redactStoryResult(storyResult);

    expect(JSON.stringify(storyResult)).toBe(before);
  });
});
