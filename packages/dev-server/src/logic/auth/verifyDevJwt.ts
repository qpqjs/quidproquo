import { Nullable } from '@qpqjs/core';

import { timingSafeEqual } from 'crypto';

import { DEV_JWT_HEADER } from './DEV_JWT_HEADER';
import { signDevJwtSegments } from './signDevJwtSegments';

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
