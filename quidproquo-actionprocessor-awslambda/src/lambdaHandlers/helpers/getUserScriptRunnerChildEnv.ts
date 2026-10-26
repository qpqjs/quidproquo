/**
 * The environment the runner's child starts with: the lambda's, minus every AWS_* variable.
 * Those carry the runner role's credentials, and a script must not be handed even those.
 */
export const getUserScriptRunnerChildEnv = (env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('AWS_')));
