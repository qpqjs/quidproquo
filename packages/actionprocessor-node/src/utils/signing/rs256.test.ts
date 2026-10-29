import { createPublicKey } from 'crypto';
import { describe, expect, it } from 'vitest';

import { base64UrlDecode } from './base64Url';
import { generateRs256KeyPair } from './generateRs256KeyPair';
import { rs256Sign, rs256Verify } from './rs256';
import { SigningMalformedSignatureError } from './SigningMalformedSignatureError';
import { spkiDerToPem } from './spkiDerToPem';

describe('rs256', () => {
  const { privateKeyPem, publicKeyPem } = generateRs256KeyPair();

  it('signs deterministically and verifies with the public half', () => {
    const signature = rs256Sign(privateKeyPem, 'header.payload');

    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(rs256Sign(privateKeyPem, 'header.payload')).toBe(signature);
    expect(rs256Verify(publicKeyPem, 'header.payload', signature)).toBe(true);
  });

  it('rejects a signature over a different message or from a different key', () => {
    const signature = rs256Sign(privateKeyPem, 'header.payload');
    const other = generateRs256KeyPair();

    expect(rs256Verify(publicKeyPem, 'header.tampered', signature)).toBe(false);
    expect(rs256Verify(other.publicKeyPem, 'header.payload', signature)).toBe(false);
  });

  // Security regression: a well-formed signature with any bit changed is simply false, never true and never a throw
  // that could be mistaken for a transport problem.
  it('rejects a signature with a single flipped bit without throwing', () => {
    const signature = rs256Sign(privateKeyPem, 'header.payload');
    const bytes = Buffer.from(base64UrlDecode(signature));
    bytes[bytes.length - 1] ^= 0x01;
    const flipped = bytes.toString('base64url');

    expect(rs256Verify(publicKeyPem, 'header.payload', flipped)).toBe(false);
  });

  it('throws MalformedSignature for a signature that is not base64url', () => {
    expect(() => rs256Verify(publicKeyPem, 'header.payload', 'not base64url!')).toThrow(SigningMalformedSignatureError);
    expect(() => base64UrlDecode('abc+/=')).toThrow(SigningMalformedSignatureError);
  });

  it('round-trips an SPKI DER through spkiDerToPem', () => {
    const der = createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }) as Buffer;

    expect(spkiDerToPem(der)).toBe(publicKeyPem.trim());
  });
});
