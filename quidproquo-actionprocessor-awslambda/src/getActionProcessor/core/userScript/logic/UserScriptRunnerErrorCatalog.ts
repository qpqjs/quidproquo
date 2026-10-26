/** The error names an action that goes through the runner must carry; PayloadTooLarge only where the request carries args. */
export type UserScriptRunnerErrorCatalog = {
  InvalidScope: string;
  RunnerUnavailable: string;
  TimedOut: string;
  PayloadTooLarge?: string;
};
