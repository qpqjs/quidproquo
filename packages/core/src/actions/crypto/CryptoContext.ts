// Opaque additional-authenticated-data for crypto operations: the same pairs
// must be supplied at encrypt and decrypt or decryption fails. Values are NOT
// encrypted and NOT secret (they appear in provider audit logs in the clear).
export type CryptoContext = Record<string, string>;
