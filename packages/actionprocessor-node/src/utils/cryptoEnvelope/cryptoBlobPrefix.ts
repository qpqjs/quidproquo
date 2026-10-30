// Version prefix on every ciphertext this capability produces. Bump the
// version (qpqcrypto:v2:...) to change the blob format; decrypt dispatches on
// the prefix, so old blobs keep working without a data migration.
export const CRYPTO_BLOB_PREFIX_V1 = 'qpqcrypto:v1:';
