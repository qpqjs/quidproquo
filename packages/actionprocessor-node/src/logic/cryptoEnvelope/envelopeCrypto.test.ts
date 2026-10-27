import { randomBytes } from 'crypto';
import { describe, expect, it } from 'vitest';

import { createLocalMasterKeyDataKeyProvider } from './createLocalMasterKeyDataKeyProvider';
import { CRYPTO_BLOB_PREFIX_V1 } from './cryptoBlobPrefix';
import { CryptoContextMismatchError } from './CryptoContextMismatchError';
import { CryptoMalformedCiphertextError } from './CryptoMalformedCiphertextError';
import { envelopeDecrypt } from './envelopeDecrypt';
import { envelopeEncrypt } from './envelopeEncrypt';

const buildProvider = () => createLocalMasterKeyDataKeyProvider(randomBytes(32));

describe('envelopeEncrypt / envelopeDecrypt', () => {
  it('round-trips a value with a context', async () => {
    const provider = buildProvider();
    const context = { tenantId: 'tenant-a' };

    const ciphertext = await envelopeEncrypt('super-secret-value', context, provider);
    const plaintext = await envelopeDecrypt(ciphertext, context, provider);

    expect(plaintext).toBe('super-secret-value');
  });

  it('round-trips the empty string and unicode plaintext', async () => {
    const provider = buildProvider();

    expect(await envelopeDecrypt(await envelopeEncrypt('', undefined, provider), undefined, provider)).toBe('');
    expect(await envelopeDecrypt(await envelopeEncrypt('p€ss-wörd-😀', undefined, provider), undefined, provider)).toBe('p€ss-wörd-😀');
  });

  it('produces an opaque, versioned ciphertext that never contains the plaintext', async () => {
    const provider = buildProvider();

    const ciphertext = await envelopeEncrypt('super-secret-value', { tenantId: 'tenant-a' }, provider);

    expect(ciphertext.startsWith(CRYPTO_BLOB_PREFIX_V1)).toBe(true);
    expect(ciphertext).not.toContain('super-secret-value');
    expect(ciphertext).not.toContain('tenant-a');
  });

  it('treats omitted context and {} as the same context', async () => {
    const provider = buildProvider();

    const ciphertext = await envelopeEncrypt('value', undefined, provider);

    expect(await envelopeDecrypt(ciphertext, {}, provider)).toBe('value');
  });

  it('fails with CryptoContextMismatchError when the context differs', async () => {
    const provider = buildProvider();

    const ciphertext = await envelopeEncrypt('value', { tenantId: 'tenant-a' }, provider);

    await expect(envelopeDecrypt(ciphertext, { tenantId: 'tenant-b' }, provider)).rejects.toThrow(CryptoContextMismatchError);
    await expect(envelopeDecrypt(ciphertext, undefined, provider)).rejects.toThrow(CryptoContextMismatchError);
  });

  it('fails with CryptoContextMismatchError when decrypting a non-context blob with a context', async () => {
    const provider = buildProvider();

    const ciphertext = await envelopeEncrypt('value', undefined, provider);

    await expect(envelopeDecrypt(ciphertext, { tenantId: 'tenant-a' }, provider)).rejects.toThrow(CryptoContextMismatchError);
  });

  it('fails with CryptoMalformedCiphertextError for non-blob input', async () => {
    const provider = buildProvider();

    await expect(envelopeDecrypt('not-a-blob', undefined, provider)).rejects.toThrow(CryptoMalformedCiphertextError);
    await expect(envelopeDecrypt('qpqcrypto:v9:AAAA', undefined, provider)).rejects.toThrow(CryptoMalformedCiphertextError);
  });

  it('fails with CryptoMalformedCiphertextError for a tampered blob (context intact)', async () => {
    const provider = buildProvider();

    const ciphertext = await envelopeEncrypt('value', { tenantId: 'tenant-a' }, provider);

    // Flip a byte of the encrypted payload only, leaving the context hash
    // intact, so this must surface as corruption rather than context mismatch
    const fields = JSON.parse(Buffer.from(ciphertext.slice(CRYPTO_BLOB_PREFIX_V1.length), 'base64').toString('utf8'));
    const corruptPayload = Buffer.from(fields.ct, 'base64');
    corruptPayload[0] = corruptPayload[0] ^ 0xff;
    const tamperedJson = JSON.stringify({ ...fields, ct: corruptPayload.toString('base64') });
    const tampered = `${CRYPTO_BLOB_PREFIX_V1}${Buffer.from(tamperedJson, 'utf8').toString('base64')}`;

    await expect(envelopeDecrypt(tampered, { tenantId: 'tenant-a' }, provider)).rejects.toThrow(CryptoMalformedCiphertextError);
  });

  it('fails when decrypting with a different master key', async () => {
    const ciphertext = await envelopeEncrypt('value', undefined, buildProvider());

    await expect(envelopeDecrypt(ciphertext, undefined, buildProvider())).rejects.toThrow(CryptoMalformedCiphertextError);
  });
});
