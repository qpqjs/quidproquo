// Thrown when a signature is not decodable as base64url. Carries a stable `code`
// so processors can map it to askCryptoVerify's MalformedSignature error type
// without depending on the class identity across bundles.
export class SigningMalformedSignatureError extends Error {
  code = 'QpqSigningMalformedSignature';

  constructor(message: string) {
    super(message);
    this.name = 'SigningMalformedSignatureError';
  }
}
