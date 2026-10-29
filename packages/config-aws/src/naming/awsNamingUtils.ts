import {
  CrossModuleOwner,
  EventBusQPQConfigSetting,
  getScopedKvsIndexPartitionKeys,
  KeyValueStoreQPQConfigSetting,
  KvsIndex,
  KvsKey,
  Nullable,
  QPQConfig,
  qpqCoreUtils,
  ResourceName,
} from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { qpqConfigAwsUtils } from '../qpqConfigAwsUtils';
import { getAwsServiceAccountInfoByDeploymentInfo } from '../utils/configUtils';
import { getScopedKvsIndexAttributeName } from './getScopedKvsIndexAttributeName';
import { resolveDeploymentFromConfig } from './resolveDeploymentFromConfig';
import { withFeatureSuffix } from './withFeatureSuffix';

type AwsDeploymentContext = {
  application: string;
  service: string;
  environment: string;
  feature?: string;
};

// Core owns the owner fallback; this only renames `module` to the `service` these name builders take.
const resolveOwnerDeploymentContext = (qpqConfig: QPQConfig, owner?: CrossModuleOwner): AwsDeploymentContext => {
  const { application, module, environment, feature } = qpqCoreUtils.resolveOwnerDeploymentContext(qpqConfig, owner);

  return { application, service: module, environment, feature };
};

export const getGlobalConfigRuntimeResourceName = (resourceName: string, application: string, environment: string, feature?: string) =>
  withFeatureSuffix(`${resourceName}-${application}-${environment}`, feature);

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

export const getConfigRuntimeResourceName = (resourceName: string, application: string, service: string, environment: string, feature?: string) =>
  withFeatureSuffix(`${resourceName}-${application}-${service}-${environment}`, feature);

/** `<application>-<environment>[-<feature>]`: the deployment a shared, service-less resource belongs to. */
export const getDeploymentName = (application: string, environment: string, feature?: string) =>
  withFeatureSuffix(`${application}-${environment}`, feature);

export const getDeploymentNameFromConfig = (qpqConfig: QPQConfig) => {
  const { application, environment, feature } = resolveDeploymentFromConfig(qpqConfig);

  return getDeploymentName(application, environment, feature);
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

/**
 * The deployed name of a resource that may belong to another module: the owner's
 * resourceNameOverride (or the local name) under the owner's full deployment context.
 * Deploy-time grants and runtime lookups must both go through here so they agree.
 */
export const resolveOwnedResourceName = (resourceName: string, qpqConfig: QPQConfig, owner?: CrossModuleOwner) =>
  resolveConfigRuntimeResourceNameFromConfig(qpqCoreUtils.resolveOwnedResourceLocalName(resourceName, owner), qpqConfig, owner);

// AWS FIFO resources (SQS queues, SNS topics) must be named with a trailing .fifo - it has
// to be the final characters, so it goes after the app-service-env decoration. Every FIFO
// resource name (runtime send, CDK resource names, cross-stack ARNs) resolves through here
// so they all stay in sync.
export const withFifoSuffix = (resourceName: string, isFifo?: boolean) => (isFifo ? `${resourceName}.fifo` : resourceName);

export const getQueueRuntimeResourceNameFromConfig = (queueName: string, qpqConfig: QPQConfig) => {
  const baseName = getConfigRuntimeResourceNameFromConfig(queueName, qpqConfig);

  return withFifoSuffix(baseName, qpqCoreUtils.getQueueByName(queueName, qpqConfig)?.isFifo);
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
  const tableNameOverride = qpqConfigAwsUtils.getDynamoTableNameOverride(resourceName, qpqConfig);
  if (tableNameOverride) {
    return tableNameOverride;
  }

  const storeConfig = qpqCoreUtils.getKeyValueStoreByName(resourceName, qpqConfig);

  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, { module: storeConfig?.owner?.module });

  return getQpqRuntimeResourceName(resourceName, application, service, environment, feature, resourceType);
};

/**
 * The attribute a store's GSI is keyed on. On a scoped store that's the hidden scope-composed copy of the
 * declared partition key, a string (see getScopedKvsIndexPartitionKeys); otherwise the declared key.
 */
export const getKvsIndexPartitionKey = (storeConfig: KeyValueStoreQPQConfigSetting, index: KvsIndex): KvsKey =>
  getScopedKvsIndexPartitionKeys(storeConfig).some((key) => key.key === index.partitionKey.key)
    ? { key: getScopedKvsIndexAttributeName(index.partitionKey.key), type: 'string' }
    : index.partitionKey;

const getUserPoolCFExportName = (userDirectoryName: string, qpqConfig: QPQConfig, resourceType: string) => {
  const userDirectoryConfig = qpqCoreUtils.resolveUserDirectoryOrThrow(userDirectoryName, qpqConfig);

  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, userDirectoryConfig.owner);
  const resourceName = qpqCoreUtils.resolveOwnedResourceLocalName(userDirectoryName, userDirectoryConfig.owner);

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
  const websocketApiConfig = qpqWebServerUtils.resolveWebsocketOrThrow(websocketApiName, qpqConfig);

  return {
    context: resolveOwnerDeploymentContext(qpqConfig, websocketApiConfig.owner),
    resourceName: qpqCoreUtils.resolveOwnedResourceLocalName(websocketApiName, websocketApiConfig.owner),
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

/**
 * The topic ARN for an event bus setting, under its owner's deployment context. The runtime
 * send, the service role's publish grant and every subscription resolve the ARN through here
 * so they can never disagree. A bus with no setting in this config (a subscription to a bus
 * another service owns) is named as given under this deployment.
 */
export const getEventBusSnsTopicArnFromConfig = (eventBusName: string, qpqConfig: QPQConfig, eventBusConfig?: Nullable<EventBusQPQConfigSetting>) => {
  const { application, service, environment, feature } = resolveOwnerDeploymentContext(qpqConfig, eventBusConfig?.owner);

  return getEventBusSnsTopicArn(
    qpqCoreUtils.resolveOwnedResourceLocalName(eventBusName, eventBusConfig?.owner),
    qpqConfig,
    service,
    environment,
    application,
    feature,
    eventBusConfig?.isFifo,
  );
};

/** The bootstrap-owned web ACL for a WAF scope; the dashboard reads its metrics by this name. */
export const getWafWebAclName = (wafScope: 'regional' | 'cloudfront', qpqConfig: QPQConfig) =>
  getConfigRuntimeBootstrapResourceNameFromConfig(`qpq-waf-${wafScope}`, qpqConfig);

/** The bootstrap SNS topic (and its schedule rule) that keeps the app's lambdas warm. */
export const getWarmLambdasTopicName = (qpqConfig: QPQConfig) => getConfigRuntimeBootstrapResourceNameFromConfig('WarmLambdas', qpqConfig);

/**
 * The name of the account's one active SES receipt rule set. Fixed, not derived from any app:
 * the set is shared by every app in the account and region, and each app's rule is what
 * carries the app-specific name.
 */
export const QPQ_EMAIL_RECEIPT_RULE_SET_NAME = 'qpq-email-receiving';

/**
 * The app's rule in the account's shared receipt rule set. Carries app, environment and module
 * so every app instance in the account gets its own rule, and the landing bucket policy can
 * name it exactly. Deliberately without the feature segment: the format is what deployed
 * rules already carry.
 */
export const getEmailReceiptRuleName = (receiverName: string, qpqConfig: QPQConfig): string => {
  const { application, service, environment } = resolveOwnerDeploymentContext(qpqConfig);

  return `${receiverName}-${application}-${service}-${environment}`;
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

  return withFeatureSuffix(`${application}-${service}-${environment}`, feature);
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

// App-level stacks (bootstrap, domain) are per deployment, not per service, so their names
// carry no module segment.
export const getAppStackName = (application: string, environment: string, feature: string | undefined, suffix: string) =>
  `${getDeploymentName(application, environment, feature)}-${suffix}`;

const getAppStackNameFromConfig = (qpqConfig: QPQConfig, suffix: string) => {
  const { application, environment, feature } = resolveDeploymentFromConfig(qpqConfig);

  return getAppStackName(application, environment, feature, suffix);
};

export const getBootstrapStackName = (qpqConfig: QPQConfig) => getAppStackNameFromConfig(qpqConfig, 'bs');

export const getDomainStackName = (qpqConfig: QPQConfig) => getAppStackNameFromConfig(qpqConfig, 'domain');

export * from './lambdaNames';
export { resolveDeploymentFromConfig } from './resolveDeploymentFromConfig';
export { withFeatureSuffix } from './withFeatureSuffix';
