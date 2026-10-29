// Decoded form of a qpqcrypto:v1 ciphertext blob.
export type CryptoBlob = {
  wrappedKey: Buffer;
  iv: Buffer;
  authTag: Buffer;
  ciphertext: Buffer;
  contextHash: string;
};
