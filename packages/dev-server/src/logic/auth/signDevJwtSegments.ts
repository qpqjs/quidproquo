import { createHmac } from 'crypto';

/** The HS256 signature over the encoded header and payload, as the token's third segment. */
export const signDevJwtSegments = (secret: string, encodedHeader: string, encodedPayload: string): string =>
  createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');
