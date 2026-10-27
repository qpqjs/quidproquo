import { createHash } from 'crypto';

// Hash of the canonical context stored inside the crypto blob. Lets decrypt
// distinguish "wrong context supplied" (hash differs) from "corrupt
// ciphertext" (hash matches, GCM tag fails). The context is not secret, so
// storing its hash leaks nothing new.
export const cryptoContextHash = (canonicalContext: string): string => {
  return createHash('sha256').update(canonicalContext, 'utf8').digest('base64');
};
