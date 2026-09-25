import { QpqAppDeploySettings } from './QpqAppDeploySettings';

/** The identity every deployment carries, whatever platform it targets. */
export type QpqAppDeploymentBase = {
  // Application name: prefixes every stack and resource, so two deployments of one
  // codebase with different names (say two products built from one repo) never share anything.
  name: string;

  environment: string;

  // Optional feature/actor suffix for a personal or feature-branch stack set.
  feature?: string;

  settings?: QpqAppDeploySettings;
};
