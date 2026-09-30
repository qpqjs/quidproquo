import { describe, expect, it } from 'vitest';

import { toExpressEvent } from './toExpressEvent';

const devPath = '/api/my-service';

// Just enough of an express request for toExpressEvent to read
const buildRequest = (url: string, overrides: Record<string, unknown> = {}): any => ({
  url,
  method: 'GET',
  protocol: 'http',
  headers: { host: 'localhost:8080' },
  socket: { remoteAddress: '1.2.3.4' },
  get: (name: string) => (name.toLowerCase() === 'host' ? 'localhost:8080' : undefined),
  body: {},
  ...overrides,
});

describe('toExpressEvent', () => {
  it('parses a single query key as a string', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users?a=1`), devPath, 'fallback');

    expect(event.query).toEqual({ a: '1' });
  });

  it('parses a repeated query key as a string array', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users?a=1&tag=x&tag=y`), devPath, 'fallback');

    expect(event.query).toEqual({ a: '1', tag: ['x', 'y'] });
  });

  it('keeps bracketed keys flat instead of nesting them like express does', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users?a[b]=1&c[]=2`), devPath, 'fallback');

    expect(event.query).toEqual({ 'a[b]': '1', 'c[]': '2' });
  });

  it('decodes encoded query values', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users?q=a+b%26c`), devPath, 'fallback');

    expect(event.query).toEqual({ q: 'a b&c' });
  });

  it('gives an empty query when the url has none', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users`), devPath, 'fallback');

    expect(event.query).toEqual({});
  });

  it('strips the dev path and the query string from the path', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users/42?a=1`), devPath, 'fallback');

    expect(event.path).toBe('/users/42');
  });

  it('maps the rest of the request onto the event', () => {
    const event = toExpressEvent(buildRequest(`${devPath}/users`, { method: 'POST', body: 'hello' }), devPath, 'fallback');

    expect(event).toEqual({
      protocol: 'http',
      host: 'localhost:8080',
      path: '/users',
      ip: '1.2.3.4',
      query: {},
      correlation: '',
      headers: { host: 'localhost:8080' },
      method: 'POST',
      isBase64Encoded: false,
      body: 'hello',
    });
  });
});
