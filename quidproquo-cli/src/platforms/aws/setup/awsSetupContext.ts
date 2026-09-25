import { QPQConfig } from 'quidproquo-core';
import { getQpqAppDeployContext, getWorkspaceAccountQpqConfig, getWorkspaceBootstrapQpqConfig } from 'quidproquo-deploy-awscdk';

import { getRoot, getServiceNames } from '../../../lib/discovery';
import { loadServiceQpqConfig } from '../../../lib/qpqConfigs';

/** Everything the AWS setup steps share: the target account/region and the app's configs. */
export type AwsSetupContext = {
  appName: string;
  environment: string;
  accountId: string;
  region: string;
  accountQpqConfig: QPQConfig;
  bootstrapQpqConfig: QPQConfig;
  serviceQpqConfigs: QPQConfig[];
};

export const buildAwsSetupContext = (appName: string, deploymentName: string): AwsSetupContext => {
  const ctx = getQpqAppDeployContext(getRoot(), appName, deploymentName);

  return {
    appName,
    environment: ctx.environment,
    accountId: ctx.accountId,
    region: ctx.region,
    accountQpqConfig: getWorkspaceAccountQpqConfig(ctx),
    bootstrapQpqConfig: getWorkspaceBootstrapQpqConfig(ctx),
    serviceQpqConfigs: getServiceNames(appName).map((service) => loadServiceQpqConfig(appName, service)),
  };
};
