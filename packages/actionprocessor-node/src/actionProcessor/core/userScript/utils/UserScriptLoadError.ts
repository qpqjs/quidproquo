/** Thrown by the user-script loader when a script's module body throws while being loaded. */
export class UserScriptLoadError extends Error {
  readonly code = 'UserScriptLoad' as const;

  constructor(
    public readonly filename: string,
    cause: unknown,
  ) {
    super(`[${filename}] threw while loading: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'UserScriptLoadError';
  }
}
