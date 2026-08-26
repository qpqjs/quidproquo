import type { HTTPMethod, NetworkRequestActionPayload } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { executeNetworkRequest } from './networkRequestUtils';

const fetchMock = vi.fn();

interface FakeResponseInit {
  status?: number;
  statusText?: string;
  // Array-of-pairs form allows repeated header names (multiple Set-Cookie lines).
  headers?: Record<string, string> | [string, string][];
  body?: unknown;
}

// A minimal stand-in for the parts of `Response` the implementation consumes,
// giving precise control over headers without the real Response auto-populating them.
const fakeResponse = ({ status = 200, statusText = 'OK', headers = {}, body }: FakeResponseInit) =>
  ({
    status,
    statusText,
    headers: new Headers(headers),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: async () => {
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  }) as unknown as Response;

const buildPayload = (overrides: Partial<NetworkRequestActionPayload<any>> = {}): NetworkRequestActionPayload<any> =>
  ({
    url: '/resource',
    basePath: 'https://api.example.com',
    method: 'GET',
    headers: { authorization: 'token' },
    params: { page: '1' },
    responseType: 'json',
    ...overrides,
  }) as NetworkRequestActionPayload<any>;

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('executeNetworkRequest', () => {
  it('issues a GET to the resolved url with params and returns the response fields', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ headers: { 'content-type': 'application/json' }, body: { hello: 'world' } }));

    const result = await executeNetworkRequest(buildPayload());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/resource?page=1');
    expect(init).toMatchObject({ method: 'GET', headers: { authorization: 'token' } });
    expect(init.body).toBeUndefined();

    expect(result).toEqual({
      headers: { 'content-type': 'application/json' },
      setCookies: [],
      status: 200,
      statusText: 'OK',
      data: { hello: 'world' },
    });
  });

  it('preserves the basePath path segment when joining a root-absolute endpoint', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    await executeNetworkRequest(buildPayload({ basePath: 'http://localhost:8080/api/template', url: '/v1/templates', params: undefined }));

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/template/v1/templates');
  });

  it.each([['POST'], ['PUT'], ['PATCH']] as const)('serializes a json body and sets content-type for a %s request', async (method: HTTPMethod) => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    await executeNetworkRequest(buildPayload({ method, body: { name: 'bob' } }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe(method);
    expect(init.body).toBe(JSON.stringify({ name: 'bob' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('leaves a string body untouched and does not override an existing content-type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    await executeNetworkRequest(buildPayload({ method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'raw' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('raw');
    expect(init.headers['Content-Type']).toBe('text/plain');
  });

  // Regression: JSON.stringify(Blob | ArrayBuffer | ...) yields "{}", which silently
  // corrupted binary uploads (presigned S3 PUTs). Raw bodies must pass through as-is.
  it('passes a Blob body through untouched instead of JSON-stringifying it to "{}"', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: '' }));

    // A File would exercise the same path — File extends Blob.
    const blob = new Blob(['\x89PNG fake binary'], { type: 'image/png' });
    await executeNetworkRequest(buildPayload({ method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: blob, responseType: 'text' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(blob);
    expect(init.headers['Content-Type']).toBe('image/png');
  });

  it.each([
    ['an ArrayBuffer', new Uint8Array([1, 2, 3]).buffer],
    ['a typed array', new Uint8Array([1, 2, 3])],
  ] as const)('passes %s body through untouched and does not add a content-type', async (_label: string, body: ArrayBuffer | Uint8Array) => {
    fetchMock.mockResolvedValue(fakeResponse({ body: '' }));

    await executeNetworkRequest(buildPayload({ method: 'PUT', body, responseType: 'text' }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(body);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('form-encodes a URLSearchParams body and sets the form content-type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    const params = new URLSearchParams({ a: '1', b: '2' });
    await executeNetworkRequest(buildPayload({ method: 'POST', headers: {}, body: params }));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('a=1&b=2');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
  });

  it.each([['DELETE'], ['HEAD'], ['OPTIONS']] as const)('issues a %s request', async (method: HTTPMethod) => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    const result = await executeNetworkRequest(buildPayload({ method }));

    expect(fetchMock.mock.calls[0][1].method).toBe(method);
    expect(result.status).toBe(200);
  });

  it('returns the raw text for a text response type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ headers: { 'content-type': 'text/plain' }, body: 'plain text' }));

    const result = await executeNetworkRequest(buildPayload({ responseType: 'text' }));

    expect(result.data).toBe('plain text');
  });

  it('decodes a binary response and derives the filename from content-disposition', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        headers: { 'content-type': 'image/png', 'content-disposition': 'attachment; filename="pic.png"' },
        body: Buffer.from('hello'),
      }),
    );

    const result = await executeNetworkRequest(buildPayload({ responseType: 'binary' }));

    expect(result.data).toEqual({
      base64Data: Buffer.from('hello').toString('base64'),
      mimetype: 'image/png',
      filename: 'pic.png',
    });
  });

  it('defaults the mimetype and filename for a binary response without headers', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: Buffer.from('hello') }));

    const result = await executeNetworkRequest(buildPayload({ responseType: 'binary' }));
    const data = result.data as { mimetype: string; filename: string };

    expect(data.mimetype).toBe('application/octet-stream');
    expect(data.filename.startsWith('file.')).toBe(true);
  });

  it('targets an absolute url when no basePath is given', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { ok: true } }));

    await executeNetworkRequest(buildPayload({ basePath: undefined, url: 'https://external/thing', params: undefined }));

    expect(fetchMock.mock.calls[0][0]).toBe('https://external/thing');
  });

  it('throws for an unsupported CONNECT method', async () => {
    await expect(executeNetworkRequest(buildPayload({ method: 'CONNECT' }))).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates a rejected fetch', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(executeNetworkRequest(buildPayload())).rejects.toThrow('network down');
  });

  // Headers.forEach collapses repeated set-cookie to the last value, so `headers` cannot
  // carry a multi-cookie login (session + CSRF); `setCookies` must preserve every line.
  it('returns every set-cookie line in order via setCookies', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        headers: [
          ['set-cookie', 'neilsens_session=abc123; Path=/; HttpOnly'],
          ['set-cookie', 'XSRF-TOKEN=xyz789; Path=/; SameSite=Lax'],
          ['content-type', 'application/json'],
        ],
        body: { ok: true },
      }),
    );

    const result = await executeNetworkRequest(buildPayload());

    expect(result.setCookies).toEqual(['neilsens_session=abc123; Path=/; HttpOnly', 'XSRF-TOKEN=xyz789; Path=/; SameSite=Lax']);
  });

  it('returns an empty setCookies list when the response sets no cookies', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ headers: { 'content-type': 'application/json' }, body: { ok: true } }));

    const result = await executeNetworkRequest(buildPayload());

    expect(result.setCookies).toEqual([]);
  });

  it('degrades setCookies to an empty list when the runtime Headers lacks getSetCookie', async () => {
    const response = fakeResponse({ headers: [['set-cookie', 'sid=abc; Path=/']], body: { ok: true } });
    (response.headers as unknown as Record<string, unknown>).getSetCookie = undefined;
    fetchMock.mockResolvedValue(response);

    const result = await executeNetworkRequest(buildPayload());

    expect(result.setCookies).toEqual([]);
  });
});
