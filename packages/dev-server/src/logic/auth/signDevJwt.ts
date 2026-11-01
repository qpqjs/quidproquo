import { DEV_JWT_HEADER } from './DEV_JWT_HEADER';
import { signDevJwtSegments } from './signDevJwtSegments';

const base64UrlEncode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

/** A dev JWT over `payload`, signed with this directory's secret. */
export const signDevJwt = (secret: string, payload: object): string => {
  const encodedHeader = base64UrlEncode(DEV_JWT_HEADER);
  const encodedPayload = base64UrlEncode(payload);

  return `${encodedHeader}.${encodedPayload}.${signDevJwtSegments(secret, encodedHeader, encodedPayload)}`;
};
