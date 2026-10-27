import crypto from 'crypto';

/**
 * Deterministic hex hash used to derive DynamoDB expression placeholder names
 * from user-supplied attribute names and values. md5 is deliberate: the hash
 * only needs to be stable and collision-poor for placeholder identity within
 * one expression, it is not a security boundary.
 */
export const getHash = (name: string): string => {
  return crypto.createHash('md5').update(name).digest('hex');
};
