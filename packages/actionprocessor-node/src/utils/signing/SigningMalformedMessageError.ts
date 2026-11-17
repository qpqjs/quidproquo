// Thrown when a message flagged as base64 is not decodable as base64. Carries a
// stable `code` so processors can map it to the MalformedMessage error type of
// askCryptoSign / askCryptoVerify without depending on the class identity across
// bundles.
export class SigningMalformedMessageError extends Error {
  code = 'QpqSigningMalformedMessage';

  constructor(message: string) {
    super(message);
    this.name = 'SigningMalformedMessageError';
  }
}
