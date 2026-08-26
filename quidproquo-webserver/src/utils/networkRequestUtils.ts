import {
  getExtensionForMimeType,
  getMimeTypeFromContentType,
  HTTPMethod,
  HTTPNetworkResponse,
  NetworkRequestActionPayload,
  QPQBinaryData,
} from 'quidproquo-core';

// Outgoing requests abort after this many milliseconds. 30s outlasts API Gateway's 29s
// integration timeout, so slow requests surface as real gateway errors instead of
// client-side "(canceled)" aborts.
const REQUEST_TIMEOUT_MS = 30000;

// fetch cannot issue these methods - mirror the previous "not implemented" behaviour.
const unsupportedMethods: HTTPMethod[] = ['CONNECT'];

// Methods that must not carry a request body.
const bodylessMethods: HTTPMethod[] = ['GET', 'HEAD'];

// Matches axios' isAbsoluteURL: protocol (http:) or protocol-relative (//host).
const isAbsoluteUrl = (url: string): boolean => /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);

// Join basePath + url like axios' combineURLs (path concatenation), NOT URL
// resolution. `new URL('/v1/x', 'http://host/api/svc')` drops the base path
// because a leading-slash url is root-absolute; we want '.../api/svc/v1/x'.
const combineUrls = (basePath: string, url: string): string => (url ? `${basePath.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}` : basePath);

const buildRequestUrl = (payload: NetworkRequestActionPayload<any>): string => {
  const fullUrl = payload.basePath && !isAbsoluteUrl(payload.url) ? combineUrls(payload.basePath, payload.url) : payload.url;

  const url = new URL(fullUrl);

  Object.entries(payload.params || {}).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.toString();
};

const getHeaderValue = (headers: Record<string, string>, name: string): string | undefined => {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : headers[key];
};

const hasHeader = (headers: Record<string, string>, name: string): boolean => getHeaderValue(headers, name) !== undefined;

// Body-type predicates, mirroring axios' transformRequest checks. Each global is
// typeof-guarded because Blob/FormData/URLSearchParams/ReadableStream aren't defined
// in every runtime, and an unguarded `instanceof` against an undefined global throws.
const isString = (body: unknown): body is string => typeof body === 'string';
const isArrayBuffer = (body: unknown): body is ArrayBuffer => body instanceof ArrayBuffer;
// Covers TypedArrays, DataView, and Node Buffer (a Uint8Array subclass). Narrowed to
// ArrayBuffer-backed (not SharedArrayBuffer) views, which is what fetch's BodyInit accepts.
const isArrayBufferView = (body: unknown): body is ArrayBufferView<ArrayBuffer> => ArrayBuffer.isView(body);
// Covers File too, which extends Blob.
const isBlob = (body: unknown): body is Blob => typeof Blob !== 'undefined' && body instanceof Blob;
const isFormData = (body: unknown): body is FormData => typeof FormData !== 'undefined' && body instanceof FormData;
const isUrlSearchParams = (body: unknown): body is URLSearchParams => typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
const isReadableStream = (body: unknown): body is ReadableStream => typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;

// A non-null object (arrays included) — the payloads we JSON-serialise.
const isObjectPayload = (body: unknown): boolean => body !== null && typeof body === 'object';
const hasJsonContentType = (headers: Record<string, string>): boolean =>
  (getHeaderValue(headers, 'content-type') || '').toLowerCase().includes('application/json');

// Resolve payload.body into a fetch BodyInit, mirroring axios' transformRequest: raw
// byte/stream/form bodies pass through untouched; only object payloads (or an explicit
// JSON content-type) get JSON.stringify'd. JSON.stringify(Blob | ArrayBuffer) yields
// "{}", which previously corrupted binary uploads (e.g. presigned S3 PUTs). May set a
// default Content-Type on `headers`.
const resolveRequestBody = (payload: NetworkRequestActionPayload<any>, headers: Record<string, string>): BodyInit | undefined => {
  const { body, method } = payload;

  if (body === undefined || bodylessMethods.includes(method)) {
    return undefined;
  }

  if (isString(body) || isArrayBuffer(body) || isArrayBufferView(body) || isBlob(body) || isFormData(body) || isReadableStream(body)) {
    return body;
  }

  if (isUrlSearchParams(body)) {
    if (!hasHeader(headers, 'content-type')) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    }
    return body.toString();
  }

  if (isObjectPayload(body) || hasJsonContentType(headers)) {
    if (!hasHeader(headers, 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    return JSON.stringify(body);
  }

  // Anything else (e.g. a bare number) — hand to fetch as-is, like axios' final return.
  return body as BodyInit;
};

const buildRequestInit = (payload: NetworkRequestActionPayload<any>, signal: AbortSignal): RequestInit => {
  const headers: Record<string, string> = { ...(payload.headers || {}) };
  const body = resolveRequestBody(payload, headers);

  return { method: payload.method, headers, body, signal };
};

const parseResponseData = async (payload: NetworkRequestActionPayload<any>, response: Response): Promise<any> => {
  if (payload.responseType === 'binary') {
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    const contentDisposition = response.headers.get('content-disposition') || '';
    const filename = contentDisposition.match(/filename="([^"]+)"/)?.[1] || `file.${getExtensionForMimeType(getMimeTypeFromContentType(mimeType))}`;

    return {
      base64Data: buffer.toString('base64'),
      mimetype: mimeType,
      filename,
    } as QPQBinaryData;
  }

  const text = await response.text();

  if (payload.responseType === 'text') {
    return text;
  }

  // json
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Headers.forEach yields only the last set-cookie value; the full list is only reachable
// via getSetCookie(). Guarded because not every runtime's Headers implements it
// (older node, some fetch polyfills); those degrade to [] rather than throwing.
const getSetCookies = (headers: Headers): string[] => (typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : []);

const headersToRecord = (headers: Headers): Record<string, string> => {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
};

export const executeNetworkRequest = async <R>(payload: NetworkRequestActionPayload<any>): Promise<HTTPNetworkResponse<R>> => {
  if (unsupportedMethods.includes(payload.method)) {
    throw new Error(`Request method not implemented [${payload.method}]`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildRequestUrl(payload), buildRequestInit(payload, controller.signal));

    return {
      headers: headersToRecord(response.headers),
      setCookies: getSetCookies(response.headers),
      status: response.status,
      statusText: response.statusText,
      data: await parseResponseData(payload, response),
    };
  } finally {
    clearTimeout(timeout);
  }
};
