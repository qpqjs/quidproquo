import { UserScriptBuildErrorCode } from '../../build/UserScriptBuildError';

// The error names a build action's catalog must carry for the build's own codes.
export type UserScriptBuildErrorCatalog = Record<
  'SourceNotFound' | 'BuildFailed' | 'OutputNotSingleFile' | 'NoExports' | 'NonFunctionExport',
  string
>;

/**
 * The action error type for a build failure. Codes map one to one, except that a missing
 * entry is the caller's source being wrong, not the build, so it is SourceNotFound.
 */
export const getUserScriptBuildErrorType = (code: UserScriptBuildErrorCode, errorType: UserScriptBuildErrorCatalog): string => {
  const byCode: Record<UserScriptBuildErrorCode, string> = {
    [UserScriptBuildErrorCode.NoEntry]: errorType.SourceNotFound,
    [UserScriptBuildErrorCode.BuildFailed]: errorType.BuildFailed,
    [UserScriptBuildErrorCode.OutputNotSingleFile]: errorType.OutputNotSingleFile,
    [UserScriptBuildErrorCode.NoExports]: errorType.NoExports,
    [UserScriptBuildErrorCode.NonFunctionExport]: errorType.NonFunctionExport,
  };

  return byCode[code];
};
