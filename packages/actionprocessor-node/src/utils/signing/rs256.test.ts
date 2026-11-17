import { createPublicKey, verify } from 'crypto';
import { describe, expect, it } from 'vitest';

import { base64UrlDecode } from './base64Url';
import { generateRs256KeyPair } from './generateRs256KeyPair';
import { rs256Sign, rs256Verify } from './rs256';
import { SigningMalformedMessageError } from './SigningMalformedMessageError';
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
    bytes![bytes.length - 1]! ^= 0x01;
    const flipped = bytes.toString('base64url');

    expect(rs256Verify(publicKeyPem, 'header.payload', flipped)).toBe(false);
  });

  it('throws MalformedSignature for a signature that is not base64url', () => {
    expect(() => rs256Verify(publicKeyPem, 'header.payload', 'not base64url!')).toThrow(SigningMalformedSignatureError);
    expect(() => base64UrlDecode('abc+/=')).toThrow(SigningMalformedSignatureError);
  });

  // Binary data (a DER structure, say) has bytes that are not valid UTF-8, so it travels as base64 and the
  // signature must cover the decoded bytes, not the base64 text.
  it('signs the decoded bytes of a base64 message', () => {
    const bytes = Buffer.from([0x31, 0x81, 0xff, 0x00, 0xa0, 0xfe]);
    const signature = rs256Sign(privateKeyPem, bytes.toString('base64'), 'base64');

    expect(verify('sha256', bytes, createPublicKey(publicKeyPem), Buffer.from(signature, 'base64url'))).toBe(true);
    expect(rs256Verify(publicKeyPem, bytes.toString('base64'), signature, 'base64')).toBe(true);
    expect(rs256Verify(publicKeyPem, bytes.toString('base64'), signature)).toBe(false);
  });

  it('throws MalformedMessage for a base64 message that is not base64, and never for text', () => {
    expect(() => rs256Sign(privateKeyPem, 'not base64!', 'base64')).toThrow(SigningMalformedMessageError);
    expect(() => rs256Verify(publicKeyPem, 'abc', 'c2ln', 'base64')).toThrow(SigningMalformedMessageError);
    expect(() => rs256Sign(privateKeyPem, 'not base64!')).not.toThrow();
  });

  it('round-trips an SPKI DER through spkiDerToPem', () => {
    const der = createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' }) as Buffer;

    expect(spkiDerToPem(der)).toBe(publicKeyPem.trim());
  });
});
