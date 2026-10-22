/** Thrown by the user-script loader when a script requires a module outside the shared package list. */
export class UserScriptModuleNotFoundError extends Error {
  readonly code = 'UserScriptModuleNotFound' as const;

  constructor(
    public readonly specifier: string,
    public readonly requestedBy: string,
  ) {
    super(`[${requestedBy}] cannot require [${specifier}]: only the shared framework packages are available to a user script`);
    this.name = 'UserScriptModuleNotFoundError';
  }
}
