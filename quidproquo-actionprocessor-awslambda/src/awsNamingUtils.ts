import { getAwsServiceAccountInfoByDeploymentInfo, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { CrossModuleOwner, QPQConfig, qpqCoreUtils, ResourceName } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

type AwsDeploymentContext = {
  application: string;
  service: string;
  environment: string;
  feature?: string;
};

// A resource declared with a CrossModuleOwner belongs to another service. Every owner field
// falls back to the executing service's own deployment context, so all consumers resolve the
// exact name the owning service deployed under.
const resolveOwnerDeploymentContext = (qpqConfig: QPQConfig, owner?: CrossModuleOwner): AwsDeploymentContext => ({
  application: owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
  service: owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
  environment: owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
  feature: owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
});

export const getGlobalConfigRuntimeResourceName = (resourceName: string, application: string, environment: string, feature?: string) => {
  const baseName = `${resourceName}-${application}-${environment}`;

  if (feature) {
    return `${baseName}-${feature}`;
  }

  return baseName;
};

export const getGlobalQpqRuntimeResourceName = (
  resourceName: string,
  application: string,
  environment: string,
  feature?: string,
  resourceType: string = '',
) => {
  const name = getGlobalConfigRuntimeResourceName(resourceName, application, environment, feature);
  return `${name}-qpq${resourceType}`;
};

export const getConfigRuntimeResourceName = (resourceName: string, application: string, service: string, environment: string, feature?: string) => {
  const baseName = `${resourceName}-${application}-${service}-${environment}`;

  if (feature) {
    return `${baseName}-${feature}`;
  }

  return baseName;
};

// Bootstrap resources are shared per app+environment, so like global names they carry no
// service segment.
export const getConfigRuntimeBootstrapResourceName = (resourceName: string, application: string, environment: string, feature?: string) =>
  getGlobalConfigRuntimeResourceName(resourceName, application, environment, feature);

export const resolveConfigRuntimeResourceNameFromConfig = (resourceName: string, qpqConfig: QPQConfig, owner?: CrossModuleOwner) => {
  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, owner);

  return getConfigRuntimeResourceName(resourceName, application, service, environment, feature);
};

export const getConfigRuntimeResourceNameFromConfig = (resourceName: string, qpqConfig: QPQConfig) =>
  resolveConfigRuntimeResourceNameFromConfig(resourceName, qpqConfig);

// AWS FIFO resources (SQS queues, SNS topics) must be named with a trailing .fifo - it has
// to be the final characters, so it goes after the app-service-env decoration. Every FIFO
// resource name (runtime send, CDK resource names, cross-stack ARNs) resolves through here
// so they all stay in sync.
export const withFifoSuffix = (resourceName: string, isFifo?: boolean) => (isFifo ? `${resourceName}.fifo` : resourceName);

export const getQueueRuntimeResourceNameFromConfig = (queueName: string, qpqConfig: QPQConfig) => {
  const baseName = getConfigRuntimeResourceNameFromConfig(queueName, qpqConfig);

  return withFifoSuffix(baseName, qpqCoreUtils.getQueueByName(qpqConfig, queueName)?.isFifo);
};

export const getConfigRuntimeBootstrapResourceNameFromConfig = (resourceName: string, qpqConfig: QPQConfig) => {
  const application = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  return getConfigRuntimeBootstrapResourceName(resourceName, application, environment, feature);
};

/** The GitHub Actions deploy role for an app environment: `github-actions-deploy-<app>-<env>[-<feature>]`. */
export const getGithubDeployRoleNameFromConfig = (qpqConfig: QPQConfig): string =>
  getConfigRuntimeBootstrapResourceNameFromConfig('github-actions-deploy', qpqConfig);

export const getConfigRuntimeResourceNameFromConfigWithServiceOverride = (resourceName: string, qpqConfig: QPQConfig, serviceOverride?: string) =>
  resolveConfigRuntimeResourceNameFromConfig(resourceName, qpqConfig, { module: serviceOverride });

export const getQpqRuntimeResourceName = (
  resourceName: string,
  application: string,
  service: string,
  environment: string,
  feature?: string,
  resourceType: string = '',
) => {
  const name = getConfigRuntimeResourceName(resourceName, application, service, environment, feature);
  return `${name}-qpq${resourceType}`;
};

export const getQpqRuntimeResourceNameFromConfig = (resourceName: ResourceName, qpqConfig: QPQConfig, resourceType: string = '') => {
  const crossServiceResourceName = qpqCoreUtils.resolveCrossServiceResourceName(resourceName);

  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, { module: crossServiceResourceName.service });

  return getQpqRuntimeResourceName(crossServiceResourceName.name, application, service, environment, feature, resourceType);
};

// Note: only the owner's module is honoured here; an owner application/environment/feature on
// a kvs config does not change the table name. Changing that now would orphan deployed tables.
export const getKvsDynamoTableNameFromConfig = (resourceName: string, qpqConfig: QPQConfig, resourceType: string = '') => {
  const tableNameOverride = qpqConfigAwsUtils.getDynamoTableNameOverrride(resourceName, qpqConfig);
  if (tableNameOverride) {
    return tableNameOverride;
  }

  const storeConfig = qpqCoreUtils.getKeyValueStoreByName(qpqConfig, resourceName);

  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, { module: storeConfig?.owner?.module });

  return getQpqRuntimeResourceName(resourceName, application, service, environment, feature, resourceType);
};

const getUserPoolCFExportName = (userDirectoryName: string, qpqConfig: QPQConfig, resourceType: string) => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(userDirectoryName, qpqConfig);

  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, userDirectoryConfig.owner);
  const resourceName = userDirectoryConfig.owner?.resourceNameOverride || userDirectoryName;

  return getQpqRuntimeResourceName(resourceName, application, service, environment, feature, resourceType);
};

export const getCFExportNameUserPoolIdFromConfig = (userDirectoryName: string, qpqConfig: QPQConfig) =>
  getUserPoolCFExportName(userDirectoryName, qpqConfig, 'user-pool-id-export');

export const getCFExportNameUserPoolClientIdFromConfig = (userDirectoryName: string, qpqConfig: QPQConfig) =>
  getUserPoolCFExportName(userDirectoryName, qpqConfig, 'user-pool-client-id-export');

const getOverridableQpqResourceExportName = (
  resourceName: string,
  qpqConfig: QPQConfig,
  resourceType: string,
  serviceOverride?: string,
  applicationOverride?: string,
) => {
  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, {
    application: applicationOverride,
    module: serviceOverride,
  });

  return getQpqRuntimeResourceName(resourceName, application, service, environment, feature, resourceType);
};

export const getCFExportNameCachePolicyIdFromConfig = (
  cacheConfigName: string,
  qpqConfig: QPQConfig,

  serviceOverride?: string,
  applicationOverride?: string,
) => getOverridableQpqResourceExportName(cacheConfigName, qpqConfig, 'cache-policy-name-export', serviceOverride, applicationOverride);

export const getCFExportNameApiKeyIdFromConfig = (
  apiKeyName: string,
  qpqConfig: QPQConfig,

  serviceOverride?: string,
  applicationOverride?: string,
) => getOverridableQpqResourceExportName(apiKeyName, qpqConfig, 'api-key-id-export', serviceOverride, applicationOverride);

export const getCFExportNameSnsTopicArnFromConfig = (
  eventBusName: string,
  qpqConfig: QPQConfig,

  applicationOverride?: string,
) => {
  const application = applicationOverride || qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  return getGlobalQpqRuntimeResourceName(eventBusName, application, environment, feature, 'sns-topic-arn-export');
};

export const getCFExportNameDistributionIdArnFromConfig = (
  webEntryName: string,
  qpqConfig: QPQConfig,

  serviceOverride?: string,
  applicationOverride?: string,
) => getOverridableQpqResourceExportName(webEntryName, qpqConfig, 'distribution-id-export', serviceOverride, applicationOverride);

const resolveWebsocketApiNaming = (websocketApiName: string, qpqConfig: QPQConfig) => {
  const websocketApiConfig = qpqWebServerUtils.getWebsocketEntryByApiName(websocketApiName, qpqConfig);

  return {
    context: resolveOwnerDeploymentContext(qpqConfig, websocketApiConfig.owner),
    resourceName: websocketApiConfig.owner?.resourceNameOverride || websocketApiName,
  };
};

export const getCFExportNameWebsocketApiIdFromConfig = (websocketApiName: string, qpqConfig: QPQConfig) => {
  const { context, resourceName } = resolveWebsocketApiNaming(websocketApiName, qpqConfig);

  return getQpqRuntimeResourceName(
    resourceName,
    context.application,
    context.service,
    context.environment,
    context.feature,
    'websocket-api-id-export',
  );
};

// SSM parameter holding a websocket api's AWS-generated id, written by the owning service's
// inf stack. Referencing services resolve it at deploy time to build exact execute-api
// grants (deploy the owning inf stack first - same owner-publishes/others-read pattern as
// the domain certificate arn parameter).
export const getWebsocketApiIdSsmParameterName = (websocketApiName: string, qpqConfig: QPQConfig) => {
  const { context, resourceName } = resolveWebsocketApiNaming(websocketApiName, qpqConfig);

  return `/qpq/websocket/api-id/${getConfigRuntimeResourceName(resourceName, context.application, context.service, context.environment, context.feature)}`;
};

export const getEventBusSnsTopicArn = (
  eventBusName: string,
  qpqConfig: QPQConfig,

  module: string,
  environment: string,
  application: string,
  feature?: string,

  isFifo?: boolean,
) => {
  const topicName = withFifoSuffix(getConfigRuntimeResourceName(eventBusName, application, module, environment, feature), isFifo);

  const accountInfo = getAwsServiceAccountInfoByDeploymentInfo(qpqConfig, module, environment, feature, application);

  const awsAccountId = accountInfo.awsAccountId;
  const region = accountInfo.awsRegion;

  return `arn:aws:sns:${region}:${awsAccountId}:${topicName}`;
};

// The account stack owns account-level resources (cloud trail, budgets, security services)
// so they never share an app's lifecycle. The name is deliberately static: stack names are
// already namespaced per account+region, and the resources it holds meter/audit the whole
// account - an app/environment segment would only fake a separation that doesn't exist.
// Everything in one account converges on this one stack, so exactly ONE repo/config must
// own it, and actor (feature) deploys must not deploy it.
export const getAccountStackName = () => 'qpq-account';

export const getBaseStackName = (qpqConfig: QPQConfig) => {
  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig);

  const baseName = `${application}-${service}-${environment}`;

  if (feature) {
    return `${baseName}-${feature}`;
  }

  return baseName;
};

export const getInfStackName = (qpqConfig: QPQConfig) => {
  return `${getBaseStackName(qpqConfig)}-inf`;
};

export const getWebStackName = (qpqConfig: QPQConfig) => {
  return `${getBaseStackName(qpqConfig)}-web`;
};

export const getApiStackName = (qpqConfig: QPQConfig) => {
  return `${getBaseStackName(qpqConfig)}-api`;
};

// App-level stacks (bootstrap, domain) are shared by every module of the app, so their
// names carry no module segment.
const getAppStackName = (qpqConfig: QPQConfig, suffix: string) => {
  const appName = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  const baseName = `${appName}-${environment}`;

  if (feature) {
    return `${baseName}-${feature}-${suffix}`;
  }

  return `${baseName}-${suffix}`;
};

export const getBootstrapStackName = (qpqConfig: QPQConfig) => getAppStackName(qpqConfig, 'bs');

export const getDomainStackName = (qpqConfig: QPQConfig) => getAppStackName(qpqConfig, 'domain');
