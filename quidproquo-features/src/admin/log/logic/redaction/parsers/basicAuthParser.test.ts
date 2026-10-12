import { describe, expect, it } from 'vitest';

import { basicAuthParser } from './basicAuthParser';

const encoded = Buffer.from('client-1:ca_secret').toString('base64');

describe('basicAuthParser', () => {
  it('reports the encoded credentials, the decoded pair and the password, without modifying the log', () => {
    const log = { correlation: 'c1', input: [{ headers: { Authorization: `Basic ${encoded}` } }] } as any;

    const { redactedLog, redactions } = basicAuthParser(log);

    expect(redactedLog).toBe(log);
    expect(redactions).toEqual([encoded, 'client-1:ca_secret', 'ca_secret']);
  });

  it('finds Basic credentials inside other strings, whatever the scheme case', () => {
    const log = { history: [{ act: { payload: { msg: `curl -H "authorization: basic ${encoded}" https://x` } } }] } as any;

    expect(basicAuthParser(log).redactions).toContain('ca_secret');
  });

  it('ignores text that only looks like Basic auth', () => {
    const noColon = Buffer.from('justaword').toString('base64');
    const log = { input: ['Basic plan', 'Basic !!notbase64', `Basic ${noColon}`] } as any;

    expect(basicAuthParser(log).redactions).toEqual([]);
  });
});
