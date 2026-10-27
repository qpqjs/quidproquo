import { QpqAppDeployment } from './QpqAppDeployment';

/**
 * apps/<app>/deploy.config.json: the single source of truth for where and as what
 * an app deploys. Kept as JSON so tooling can read it before any TS executes. Nothing
 * in it is overridden by env vars or flags; to change a value, change the file or add
 * an entry. Holds identity and settings only, never credentials.
 */
export type QpqAppDeployConfig = {
  // deployment name -> target. The name is what `qpq go --deployment <name>` selects.
  deployments: Record<string, QpqAppDeployment>;
};
