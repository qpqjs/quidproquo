/** The built script a runner request is about, as it sits on a drive. */
export type UserScriptRunnerSource = {
  drive: string;
  filepath: string;
  scope?: string;
};
