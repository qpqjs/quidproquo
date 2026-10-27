import { getQpqAppDeployConfig, getQpqAppDeployConfigPath, primeDeploymentEnv } from 'quidproquo-config-aws';
import { QpqAppDeployment, QpqDeployEnvVar } from 'quidproquo-core';

import { getPlatformDriver } from '../platforms';
import { getArgValue } from './args';
import { getRoot } from './discovery';
import { promptSelect } from './prompts';

export const DEPLOYMENT_FLAG = '--deployment';

export type ResolvedDeployment = {
  deploymentName: string;
  deployment: QpqAppDeployment;
};

// Which entry to use: the flag, then DEPLOY_NAME (set by a parent qpq command or CI: a
// selector, never a value), then the sole entry, then a prompt. Headless with several
// entries and no selection is an error rather than a guess.
const selectDeploymentName = async (argv: string[], appName: string, configuredNames: string[]): Promise<string> => {
  const requested = getArgValue(argv, DEPLOYMENT_FLAG) || process.env[QpqDeployEnvVar.deployName];

  if (requested) {
    if (!configuredNames.includes(requested)) {
      console.error(`Unknown deployment '${requested}' in ${getQpqAppDeployConfigPath(getRoot(), appName)}. Configured: ${configuredNames.join(', ')}`);
      process.exit(1);
    }
    return requested;
  }

  if (configuredNames.length === 1) {
    console.log(`Using deployment: ${configuredNames[0]}`);
    return configuredNames[0];
  }

  if (process.stdin.isTTY) {
    return promptSelect('Select deployment', configuredNames);
  }

  console.error(`No deployment selected. Pass ${DEPLOYMENT_FLAG} <name>. Configured: ${configuredNames.join(', ')}`);
  return process.exit(1);
};

/**
 * Selects an entry of the app's deploy.config.json and writes it into process.env
 * (identity, environment, feature, settings) before any service config is loaded.
 * The file is the source of truth: nothing in the shell overrides a value in it.
 * The platform driver validates its own settings, so an aws entry missing its
 * account or region fails here, not inside cdk.
 */
export const resolveDeployment = async (argv: string[], appName: string): Promise<ResolvedDeployment> => {
  const { deployments } = getQpqAppDeployConfig(getRoot(), appName);
  const deploymentName = await selectDeploymentName(argv, appName, Object.keys(deployments));
  const deployment = deployments[deploymentName];

  primeDeploymentEnv(appName, deploymentName, deployment);
  getPlatformDriver(deployment.platform).prepareDeployment(deploymentName, deployment);

  return { deploymentName, deployment };
};
