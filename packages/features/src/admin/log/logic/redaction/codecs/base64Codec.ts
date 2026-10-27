import { TransportCodec } from '../types/TransportCodec';

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

// Strict on purpose: every short word is valid base64 alphabet, so the bytes must be valid
// utf8 AND re-encode to exactly the original text before the leaf counts as base64.
const decodeBase64 = (text: string): string | null => {
  if (text.length < 4 || text.length % 4 !== 0 || !base64Pattern.test(text)) {
    return null;
  }

  const inner = Buffer.from(text, 'base64').toString('utf8');
  return Buffer.from(inner, 'utf8').toString('base64') === text ? inner : null;
};

/** Standard base64 with padding, as API gateway wraps request bodies. */
export const base64Codec: TransportCodec = {
  decode: decodeBase64,
  encode: (text) => Buffer.from(text, 'utf8').toString('base64'),
};
