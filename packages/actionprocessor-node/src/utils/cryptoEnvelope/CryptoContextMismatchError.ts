// Thrown when the context supplied at decrypt differs from the context the
// blob was encrypted under. The `code` is what actionResultErrorFromCaughtError
// keys on, so processors can map this to a distinguishable action error.
export class CryptoContextMismatchError extends Error {
  readonly code = 'QpqCryptoContextMismatch';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoContextMismatchError';
  }
}
