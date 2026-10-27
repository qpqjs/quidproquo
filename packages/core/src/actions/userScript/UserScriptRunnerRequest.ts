import { UserScriptRunnerRequestKind } from './UserScriptRunnerRequestKind';

export type UserScriptRunnerCallRequest = {
  kind: UserScriptRunnerRequestKind.call;
  functionName: string;
  args: unknown[];
};

export type UserScriptRunnerListExportsRequest = {
  kind: UserScriptRunnerRequestKind.listExports;
};

/** One unit of work for the runner: call an export, or load the module and report its exports. */
export type UserScriptRunnerRequest = UserScriptRunnerCallRequest | UserScriptRunnerListExportsRequest;
