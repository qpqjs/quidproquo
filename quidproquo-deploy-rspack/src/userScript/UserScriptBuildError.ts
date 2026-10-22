export enum UserScriptBuildErrorCode {
  // No src/main.ts or src/main.js in the project.
  NoEntry = 'NoEntry',
  // Rspack reported errors (a refused Node builtin among them).
  BuildFailed = 'BuildFailed',
  // The build emitted more than one JavaScript file, so the output is not one loadable module.
  OutputNotSingleFile = 'OutputNotSingleFile',
  // The built module has no own enumerable exports.
  NoExports = 'NoExports',
  // An own enumerable export of the built module is not a function.
  NonFunctionExport = 'NonFunctionExport',
}

/** Thrown by buildUserScript; `code` says which step refused the project. */
export class UserScriptBuildError extends Error {
  constructor(
    public readonly code: UserScriptBuildErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UserScriptBuildError';
  }
}
