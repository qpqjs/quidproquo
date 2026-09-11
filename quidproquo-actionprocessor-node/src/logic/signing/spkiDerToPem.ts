// KMS GetPublicKey returns the SubjectPublicKeyInfo as raw DER; every JWT/JWKS
// consumer wants the PEM framing.
export const spkiDerToPem = (der: Buffer): string => {
  const lines = der.toString('base64').match(/.{1,64}/g) ?? [];

  return ['-----BEGIN PUBLIC KEY-----', ...lines, '-----END PUBLIC KEY-----'].join('\n');
};
