/**
 * Fragments of property names whose values are secrets: any property whose name CONTAINS one (not
 * just equals it, as with REDACTION_SWEEP_KEYS) is redacted AND its value swept from every string in
 * the log. Catches the spellings an exact list misses, such as `client_secret` in a form body,
 * `callbackSecret`, `X-Webhook-Secret`, `access_token`, `sessionToken` or `linkToken`. Names that
 * contain a fragment but don't hold a secret are listed in REDACTION_IGNORED_KEYS. Compared
 * case-insensitively.
 */
export const REDACTION_SWEEP_KEY_FRAGMENTS: readonly string[] = ['secret', 'token'];
