import { Nullable } from '@qpqjs/core';

import * as crypto from 'crypto';

import { FileStorageConfig, SecureUrlToken } from '../types';

// Create a signed token for secure URLs
export const createSecureUrlToken = (token: SecureUrlToken, secret: string): string => {
  const payload = JSON.stringify(token);
  const payloadBase64 = Buffer.from(payload).toString('base64url');

  // Create HMAC signature
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');

  return `${payloadBase64}.${signature}`;
};

// Verify and decode a signed token
export const verifySecureUrlToken = (tokenString: string, secret: string): Nullable<SecureUrlToken> => {
  try {
    const [payloadBase64, signature] = tokenString.split('.');

    if (!payloadBase64 || !signature) {
      return null;
    }

    // Constant-time compare: a plain string compare leaks how many leading bytes matched.
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
    const given = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      return null;
    }

    // Decode payload
    const payload = Buffer.from(payloadBase64, 'base64url').toString();
    const token: SecureUrlToken = JSON.parse(payload);

    // Check expiration
    if (token.expiresAt < Date.now()) {
      return null;
    }

    return token;
  } catch {
    return null;
  }
};

/** Origin of generated secure urls: the address and port browsers reach the file server on. */
export const getSecureUrlBaseUrl = (config: FileStorageConfig): string => {
  return `http://${config.secureUrlHost}:${config.secureUrlPublicPort}`;
};
