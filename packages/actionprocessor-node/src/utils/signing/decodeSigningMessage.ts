import { CryptoMessageEncoding } from '@qpqjs/core';

import { SigningMalformedMessageError } from './SigningMalformedMessageError';

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// The bytes a signing message stands for. Strict for base64: Buffer.from would
// silently skip characters it does not know, so a caller passing plain text with
// the base64 flag would get a signature over bytes it never meant to sign.
export const decodeSigningMessage = (message: string, messageEncoding: CryptoMessageEncoding = 'utf8'): Buffer => {
  if (messageEncoding !== 'base64') {
    return Buffer.from(message, 'utf8');
  }

  if (!BASE64_PATTERN.test(message)) {
    throw new SigningMalformedMessageError('Message is not base64 encoded');
  }

  return Buffer.from(message, 'base64');
};
