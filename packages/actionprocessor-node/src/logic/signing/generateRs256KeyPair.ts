import { generateKeyPairSync } from 'crypto';

export type Rs256KeyPair = {
  privateKeyPem: string;
  publicKeyPem: string;
};

// A local RSA-2048 pair in the same PEM encodings KMS uses (PKCS#8 private,
// SPKI public), for the dev server and tests.
export const generateRs256KeyPair = (): Rs256KeyPair => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
};
