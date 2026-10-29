// Thrown when a ciphertext is not a valid qpq crypto blob, or fails
// authenticated decryption with the correct context (i.e. corruption or
// truncation). The `code` is what actionResultErrorFromCaughtError keys on.
export class CryptoMalformedCiphertextError extends Error {
  readonly code = 'QpqCryptoMalformedCiphertext';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoMalformedCiphertextError';
  }
}
