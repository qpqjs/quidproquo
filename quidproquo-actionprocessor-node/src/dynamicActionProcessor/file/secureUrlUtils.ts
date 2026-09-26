import * as crypto from 'crypto';

import { FileStorageConfig } from './types';

export interface SecureUrlToken {
  fullFilepath: string;
  operation: 'download' | 'upload';
  expiresAt: number;
  contentType?: string;
}

// Create a signed token for secure URLs
export const createSecureUrlToken = (token: SecureUrlToken, secret: string): string => {
  const payload = JSON.stringify(token);
  const payloadBase64 = Buffer.from(payload).toString('base64url');

  // Create HMAC signature
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');

  // Return token as payload.signature
  return `${payloadBase64}.${signature}`;
};

// Verify and decode a signed token
export const verifySecureUrlToken = (tokenString: string, secret: string): SecureUrlToken | null => {
  try {
    const [payloadBase64, signature] = tokenString.split('.');

    if (!payloadBase64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');

    if (signature !== expectedSignature) {
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
  } catch (error) {
    return null;
  }
};

/** Origin of generated secure urls: the address and port browsers reach the file server on. */
export const getSecureUrlBaseUrl = (config: FileStorageConfig): string => {
  return `http://${config.secureUrlHost}:${config.secureUrlPublicPort}`;
};
