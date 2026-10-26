/** What the host asks the sandboxed runner to do with a built script. */
export enum UserScriptRunnerRequestKind {
  call = 'call',
  listExports = 'listExports',
}
