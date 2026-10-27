import { QpqAppDeploymentBase } from './QpqAppDeploymentBase';

/**
 * One entry under `deployments` in apps/<app>/deploy.config.json. `platform` names the
 * CLI driver; `platformSettings` is a flat string map, like `settings`, whose required
 * keys each platform checks for itself (quidproquo-config-aws for aws), so this layer
 * stays open to platforms it has never heard of.
 */
export type QpqAppDeployment = QpqAppDeploymentBase & {
  platform: string;
  platformSettings?: Record<string, string>;
};
