import { QpqAppDeployment, QpqDeployEnvVar } from '@qpqjs/core';

import { getPlatformDriver, QpqPlatformDriver } from '../platforms';
import { resolveAppSelection } from './resolveAppSelection';
import { resolveDeployment } from './resolveDeployment';

export type CommandContext = {
  appName: string;
  deploymentName: string;
  deployment: QpqAppDeployment;
  driver: QpqPlatformDriver;
};

export type ResolveCommandContextOptions = {
  // The env var the command honours for the app name when no --app is given.
  appEnvVar?: string;
};

// The one preamble for every deploy-facing command: which app, which entry of its
// deploy.config.json (primed into the environment), and the platform driver that entry names.
export const resolveCommandContext = async (argv: string[], options: ResolveCommandContextOptions = {}): Promise<CommandContext> => {
  const appName = await resolveAppSelection({ argv, envVar: options.appEnvVar ?? QpqDeployEnvVar.deployAppName });
  const { deploymentName, deployment } = await resolveDeployment(argv, appName);

  return { appName, deploymentName, deployment, driver: getPlatformDriver(deployment.platform) };
};
