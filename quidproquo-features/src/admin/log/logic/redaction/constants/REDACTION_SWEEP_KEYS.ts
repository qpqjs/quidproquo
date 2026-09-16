/**
 * Property names whose values are secrets: the field is redacted AND the value is swept from every
 * string in the log, since tokens and keys leak into headers, urls and log messages. Compared
 * case-insensitively.
 */
export const REDACTION_SWEEP_KEYS: readonly string[] = [
  'secret',
  'clientsecret',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'apikey',
];
