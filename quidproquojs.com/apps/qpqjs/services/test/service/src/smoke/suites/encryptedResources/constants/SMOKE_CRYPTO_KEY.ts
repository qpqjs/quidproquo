/**
 * The crypto key the encrypted probe drive and store name. Not 'smokeProbe':
 * the signing key of that name is a KMS alias too, and the two would collide.
 */
export const SMOKE_CRYPTO_KEY = 'smokeCrypto';
