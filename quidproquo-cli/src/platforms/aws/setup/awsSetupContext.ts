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

export const buildAwsSetupContext = (appName: string, environment: string): AwsSetupContext => {
  const accountId = process.env.AWS_DEFAULT_ACCOUNT ?? '';
  const region = process.env.AWS_DEFAULT_REGION ?? '';
  const ctx = getQpqAppDeployContext(getRoot(), appName, environment, process.env.ACTOR_NAME, { accountId, region });

  return {
    appName,
    environment,
    accountId,
    region,
    accountQpqConfig: getWorkspaceAccountQpqConfig(ctx),
    bootstrapQpqConfig: getWorkspaceBootstrapQpqConfig(ctx),
    serviceQpqConfigs: getServiceNames(appName).map((service) => loadServiceQpqConfig(appName, service)),
  };
};
