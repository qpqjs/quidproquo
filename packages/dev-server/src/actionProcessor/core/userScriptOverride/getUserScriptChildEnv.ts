/**
 * The environment the dev server's script child starts with: the server's, minus every AWS_*
 * variable. A developer's shell usually carries real credentials, and a script must not.
 */
export const getUserScriptChildEnv = (env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('AWS_')));
