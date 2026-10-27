import { CryptoContext } from 'quidproquo-core';

export type GeneratedDataKey = {
  plaintextKey: Buffer;
  wrappedKey: Buffer;
};

// The only part of envelope encryption that differs per runtime: how a
// one-off data key is created and wrapped (KMS in prod, a local master key in
// the dev server). The context is passed through so the wrapping layer can
// bind it too (KMS EncryptionContext, which also lands in CloudTrail).
export type DataKeyProvider = {
  generateDataKey: (context: CryptoContext) => Promise<GeneratedDataKey>;
  unwrapDataKey: (wrappedKey: Buffer, context: CryptoContext) => Promise<Buffer>;
};
