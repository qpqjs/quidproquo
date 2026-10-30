import { UserScriptArchiveError } from './UserScriptArchiveError';

/** Name-keyed, not instanceof: under npm link or module federation the error can come from another copy of this package. */
export const isUserScriptArchiveError = (error: unknown): error is UserScriptArchiveError =>
  error instanceof Error && error.name === 'UserScriptArchiveError';
