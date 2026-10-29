import { UserScriptModuleNotFoundError } from './UserScriptModuleNotFoundError';

/** Name-keyed, not instanceof: under npm link or module federation the error can come from another copy of this package. */
export const isUserScriptModuleNotFoundError = (error: unknown): error is UserScriptModuleNotFoundError =>
  error instanceof Error && error.name === 'UserScriptModuleNotFoundError';
