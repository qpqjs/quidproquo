import { SigningMalformedSignatureError } from './SigningMalformedSignatureError';

const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]*$/;

export const base64UrlEncode = (bytes: Buffer): string => bytes.toString('base64url');

// Strict: rejects standard base64 characters (+ / =) and whitespace rather than
// silently decoding them, so a caller pasting the wrong encoding fails loudly.
export const base64UrlDecode = (value: string): Buffer => {
  if (!BASE64_URL_PATTERN.test(value)) {
    throw new SigningMalformedSignatureError('Signature is not base64url encoded');
  }

  return Buffer.from(value, 'base64url');
};
