import { describe, expect, it } from 'vitest';

import { redactStoryResult } from '../redactStoryResult';
import { urlFragmentParser } from './urlFragmentParser';

const token = '4f7a1c2e9b8d4e6fa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718';

describe('urlFragmentParser', () => {
  it('reports a random token after # in a link in plain text', () => {
    const log = {
      correlation: 'c1',
      history: [{ act: { payload: { bodyText: `https://sign.example.com/#${token}\n\nHi Alex` } }, res: [undefined, undefined] }],
    } as any;

    expect(urlFragmentParser(log).redactions).toEqual([token]);
  });

  it('reports it from an href in html', () => {
    const log = { correlation: 'c1', input: [{ bodyHtml: `<a href="http://localhost:3082/#${token}" target="_blank">Review and sign</a>` }] } as any;

    expect(urlFragmentParser(log).redactions).toEqual([token]);
  });

  it('reports it from inside a json-string body and a base64 body', () => {
    const json = JSON.stringify({ data: { link: `https://sign.example.com/#${token}` } });
    const log = { correlation: 'c1', input: [{ body: json }, { body: Buffer.from(json).toString('base64'), isBase64Encoded: true }] } as any;

    expect(urlFragmentParser(log).redactions).toEqual([token, token]);
  });

  it('reports each long value in an OAuth-style fragment', () => {
    const access = 'A'.repeat(40);
    const log = { correlation: 'c1', input: [`https://app.example.com/callback#access_token=${access}&token_type=Bearer&expires_in=3600`] } as any;

    expect(urlFragmentParser(log).redactions).toEqual([access]);
  });

  it('ignores anchors, app routes, bare GUIDs and text without a URL', () => {
    const log = {
      correlation: 'c1',
      input: [
        'https://docs.example.com/page#top',
        'https://app.example.com/#/envelopes/2294a78c-a16c-4e64-ab98-89bec610613a',
        'https://app.example.com/record#2294a78c-a16c-4e64-ab98-89bec610613a',
        'see #hashtag-without-a-url-at-all-in-this-text-here',
      ],
    } as any;

    expect(urlFragmentParser(log).redactions).toEqual([]);
  });

  it('leaves the log itself unchanged (the sweep does the removing)', () => {
    const log = { correlation: 'c1', input: [`https://sign.example.com/#${token}`] } as any;

    expect(urlFragmentParser(log).redactedLog).toBe(log);
  });

  it('through the pipeline, sweeps a signing link token from the email, the bind payload and the session request', () => {
    const log = {
      correlation: 'c1',
      input: [{ body: JSON.stringify({ linkToken: token }) }],
      history: [
        {
          act: {
            type: 'Comms/SendEmail',
            payload: { bodyText: `https://sign.example.com/#${token}`, bodyHtml: `<a href="https://sign.example.com/#${token}">Sign</a>` },
          },
          res: [undefined, undefined],
        },
        { act: { type: 'Log/Create', payload: { msg: `opened ${token}` } }, res: [undefined, undefined] },
      ],
    } as any;

    expect(JSON.stringify(redactStoryResult(log))).not.toContain(token);
  });
});
