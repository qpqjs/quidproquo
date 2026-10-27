/**
 * Property names whose values are redacted in place only, not swept from the rest of the log. Compared
 * case-insensitively. Custom auth challenge keys are here too: the answer is often a short one-time
 * code, and sweeping a six digit number out of every string would hit unrelated values.
 */
export const REDACTION_FIELD_ONLY_KEYS: readonly string[] = [
  'password',
  'passwd',
  'newpassword',
  'oldpassword',
  'privatechallengeparameters',
  'challengeanswer',
];
