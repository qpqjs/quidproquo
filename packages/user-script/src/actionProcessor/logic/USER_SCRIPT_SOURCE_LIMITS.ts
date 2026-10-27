/** Caps on a script project pulled off a drive, so a build cannot exhaust the lambda it runs on. */
export const USER_SCRIPT_SOURCE_LIMITS = {
  maxFiles: 200,
  maxBytes: 2 * 1024 * 1024,
} as const;
