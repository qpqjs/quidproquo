import { UserScriptBuildError } from './UserScriptBuildError';

/** Name-keyed, not instanceof: under npm link or module federation the error can come from another copy of this package. */
export const isUserScriptBuildError = (error: unknown): error is UserScriptBuildError =>
  error instanceof Error && error.name === 'UserScriptBuildError';
