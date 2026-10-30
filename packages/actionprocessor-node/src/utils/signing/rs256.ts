import { constants, sign, verify } from 'crypto';

import { base64UrlDecode, base64UrlEncode } from './base64Url';

// RS256 = RSASSA-PKCS1-v1_5 over SHA-256, the JWT default for RSA keys and what
// KMS calls RSASSA_PKCS1_V1_5_SHA_256. Deterministic (no salt), so local and
// KMS-produced signatures for the same key + message are byte-identical.

export const RS256_KMS_SIGNING_ALGORITHM = 'RSASSA_PKCS1_V1_5_SHA_256';

export const rs256Sign = (privateKeyPem: string, message: string): string =>
  base64UrlEncode(sign('sha256', Buffer.from(message, 'utf8'), { key: privateKeyPem, padding: constants.RSA_PKCS1_PADDING }));

export const rs256Verify = (publicKeyPem: string, message: string, signature: string): boolean =>
  verify('sha256', Buffer.from(message, 'utf8'), { key: publicKeyPem, padding: constants.RSA_PKCS1_PADDING }, base64UrlDecode(signature));
