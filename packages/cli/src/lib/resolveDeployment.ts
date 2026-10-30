import { getQpqAppDeployConfig, getQpqAppDeployConfigPath, primeDeploymentEnv } from '@qpqjs/config-aws';
import { QpqAppDeployment, QpqDeployEnvVar } from '@qpqjs/core';

import { getPlatformDriver } from '../platforms';
import { getArgValue } from './args';
import { getRoot } from './discovery';
import { promptSelect } from './prompts';
import { CliError } from './CliError';
import { createOutput } from './out';

const out = createOutput('resolve-deployment');

const DEPLOYMENT_FLAG = '--deployment';

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
      throw new CliError(
        `Unknown deployment '${requested}' in ${getQpqAppDeployConfigPath(getRoot(), appName)}. Configured: ${configuredNames.join(', ')}`,
      );
    }
    return requested;
  }

  const [onlyName] = configuredNames;
  if (configuredNames.length === 1 && onlyName !== undefined) {
    out.log(`Using deployment: ${onlyName}`);
    return onlyName;
  }

  if (process.stdin.isTTY) {
    return promptSelect('Select deployment', configuredNames);
  }

  throw new CliError(`No deployment selected. Pass ${DEPLOYMENT_FLAG} <name>. Configured: ${configuredNames.join(', ')}`);
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
  if (!deployment) {
    throw new Error(`Deployment [${deploymentName}] is not in ${appName}'s deploy.config.json`);
  }

  primeDeploymentEnv(appName, deploymentName, deployment);
  getPlatformDriver(deployment.platform).prepareDeployment(deploymentName, deployment);

  return { deploymentName, deployment };
};
