import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

export type AwsDeployment = {
  application: string;
  environment: string;
  feature?: string;
};

// The service-less deployment a config belongs to. Not the owner context: that insists on a
// defineModule, and the bootstrap config (domain and bootstrap stacks, WAF) has none.
export const resolveDeploymentFromConfig = (qpqConfig: QPQConfig): AwsDeployment => ({
  application: qpqCoreUtils.getApplicationName(qpqConfig),
  environment: qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
  feature: qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
});
