/**
 * Property names the key-based parsers never redact, whatever they contain (keys inside them are still
 * checked). Compared case-insensitively. These contain a REDACTION_SWEEP_KEY_FRAGMENTS fragment but
 * don't hold a secret:
 * - `secretName` names a secret (e.g. the one askSecretGet fetched); `secretId` identifies one.
 * - `token_type` / `tokenType` is the scheme ("Bearer"), which would otherwise be swept from every
 *   string in the log.
 * - `tokenHash` is a token's one-way hash (the lookup key), not the token.
 * - `decodedAccessToken` is the caller's decoded claims (user id, username, expiry), not the token;
 *   redacting it would sweep who did what out of every log.
 */
export const REDACTION_IGNORED_KEYS: readonly string[] = [
  'id',
  'pk',
  'sk',
  'secretname',
  'secretid',
  'token_type',
  'tokentype',
  'tokenhash',
  'decodedaccesstoken',
];
