/**
 * Per-deployment values handed to infrastructure.ts as `DEPLOY_SETTING_<key>` env vars
 * (read them with `getDeploySetting` from quidproquo-core). Keys are used verbatim as
 * the env var suffix, values are always strings. Committed in cleartext: never a secret.
 */
export type QpqAppDeploySettings = Record<string, string>;
