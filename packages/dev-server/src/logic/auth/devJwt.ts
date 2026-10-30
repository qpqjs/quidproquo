import { Nullable } from '@qpqjs/core';

import { createHmac, timingSafeEqual } from 'crypto';

// The dev server's own JWTs: HS256 over a per-directory secret. Structurally a normal JWT, so
// everything that reads claims keeps working, and verifiable here, so a token minted for
// another checkout (or hand-rolled) is refused like a real pool would refuse it.
export const DEV_JWT_HEADER = { alg: 'HS256', typ: 'JWT' };

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

const signDevJwtSegments = (secret: string, encodedHeader: string, encodedPayload: string): string =>
  createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');

export const signDevJwt = (secret: string, payload: object): string => {
  const encodedHeader = base64UrlEncode(DEV_JWT_HEADER);
  const encodedPayload = base64UrlEncode(payload);

  return `${encodedHeader}.${encodedPayload}.${signDevJwtSegments(secret, encodedHeader, encodedPayload)}`;
};

/** The payload of a token this secret signed; null for anything else (malformed, other algorithm, bad signature). */
export const verifyDevJwt = <T>(secret: string, token: string): Nullable<T> => {
  const [encodedHeader, encodedPayload, signature, ...extra] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature || extra.length > 0) {
    return null;
  }

  try {
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString());
    if (header.alg !== DEV_JWT_HEADER.alg) {
      return null;
    }

    const expected = Buffer.from(signDevJwtSegments(secret, encodedHeader, encodedPayload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }

    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as T;
  } catch {
    return null;
  }
};
