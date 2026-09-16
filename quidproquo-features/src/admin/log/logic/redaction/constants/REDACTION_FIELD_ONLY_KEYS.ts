/** Property names whose values are redacted in place only, not swept from the rest of the log. Compared case-insensitively. */
export const REDACTION_FIELD_ONLY_KEYS: readonly string[] = ['password', 'passwd', 'newpassword', 'oldpassword'];
