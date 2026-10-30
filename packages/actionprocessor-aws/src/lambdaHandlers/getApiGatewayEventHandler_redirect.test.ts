import { APIGatewayEvent, Context } from 'aws-lambda';
import { afterEach, describe, expect, it } from 'vitest';

import { getApiGatewayEventHandler_redirect } from './getApiGatewayEventHandler_redirect';

const runHandler = (event: Partial<APIGatewayEvent>) => getApiGatewayEventHandler_redirect()(event as APIGatewayEvent, {} as Context);

describe('getApiGatewayEventHandler_redirect', () => {
  afterEach(() => {
    delete process.env.redirectBaseUrl;
    delete process.env.appendPath;
  });

  it('redirects straight to an absolute url', async () => {
    process.env.redirectBaseUrl = 'https://example.com/go';

    const response = await runHandler({ path: '/ignored', queryStringParameters: null });

    expect(response.statusCode).toBe(301);
    expect(response.headers?.Location).toBe('https://example.com/go');
  });

  it('preserves the request path for a domain redirect', async () => {
    process.env.redirectBaseUrl = 'https://staging.example.com';
    process.env.appendPath = 'true';

    const response = await runHandler({ path: '/page', queryStringParameters: null });

    expect(response.headers?.Location).toBe('https://staging.example.com/page');
  });

  it('appends query string parameters to the redirect url', async () => {
    process.env.redirectBaseUrl = 'https://example.com';

    const response = await runHandler({ path: '/', queryStringParameters: { a: '1', b: 'two' } });

    expect(response.headers?.Location).toBe('https://example.com?a=1&b=two');
  });

  // Security regression: the request contributes only a path and encoded query values, so no request can move the
  // redirect to another host or break the Location header with a line break.
  it('keeps a protocol-relative or user-info shaped path on the configured host', async () => {
    process.env.redirectBaseUrl = 'https://staging.example.com';
    process.env.appendPath = 'true';

    for (const path of ['//evil.example/x', '/@evil.example/x', '/\\evil.example']) {
      const response = await runHandler({ path, queryStringParameters: null });

      expect(new URL(response.headers?.Location as string).host).toBe('staging.example.com');
    }
  });

  it('encodes line breaks and separators out of query values', async () => {
    process.env.redirectBaseUrl = 'https://example.com';

    const response = await runHandler({ path: '/', queryStringParameters: { next: 'x\r\nSet-Cookie: a=b', 'a&b': '1#2' } });

    const location = response.headers?.Location as string;
    expect(location).not.toMatch(/[\r\n]/);
    expect(new URL(location).host).toBe('example.com');
    expect(new URL(location).searchParams.get('next')).toBe('x\r\nSet-Cookie: a=b');
    expect(new URL(location).searchParams.get('a&b')).toBe('1#2');
  });
});
