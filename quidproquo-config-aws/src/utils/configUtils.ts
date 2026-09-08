import { CrossModuleOwner, KeyValueStoreQPQConfigSetting, Nullable, QPQConfig, qpqCoreUtils, StorageDriveQPQConfigSetting } from 'quidproquo-core';

import {
  AccountBudgetQPQConfigSetting,
  AccountCloudTrailQPQConfigSetting,
  AccountSecurityServicesQPQConfigSetting,
  AwsAlarmQPQConfigSetting,
  AwsDataStoreRemovalPolicy,
  AwsDataStoreRemovalPolicyQPQConfigSetting,
  AwsDyanmoOverrideForKvsQPQConfigSetting,
  AwsGithubDeployRoleQPQConfigSetting,
  AwsKmsKeyQPQConfigSetting,
  AwsKmsKeyTargetType,
  AwsOrganizationQPQConfigSetting,
  AwsServiceAccountInfoQPQConfigSetting,
  AwsServiceDashboardQPQConfigSetting,
  AwsVirtualNetworkQPQConfigSetting,
  BootstrapWafQPQConfigSetting,
  defineAwsVirtualNetworkSettings,
  DomainCertificateQPQConfigSetting,
  EmailSenderAllowListQPQConfigSetting,
  EventBusQuickSubscription,
  EventBusQuickSubscriptionQPQConfigSetting,
  QPQAwsConfigSettingType,
} from '../config';
import { ApiLayer, LocalServiceAccountInfo, ServiceAccountInfo } from '../types';

export const getAwsServiceAccountInfoConfig = (qpqConfig: QPQConfig): AwsServiceAccountInfoQPQConfigSetting => {
  const serviceAccountInfos = qpqCoreUtils.getConfigSettings<AwsServiceAccountInfoQPQConfigSetting>(
    qpqConfig,
    QPQAwsConfigSettingType.awsServiceAccountInfo,
  );

  if (serviceAccountInfos.length === 0) {
    console.log(JSON.stringify(qpqConfig, null, 2));
    throw new Error('use defineAwsServiceAccountInfo to define aws deployment config');
  }

  if (serviceAccountInfos.length > 1) {
    throw new Error('max one entry of defineAwsServiceAccountInfo can be used');
  }

  return serviceAccountInfos[0];
};

/**
 * All npm packages provided at runtime by the service's lambda layers
 * (`ApiLayer.modules`). Bundlers externalize these on AWS builds. Returns []
 * when no `defineAwsServiceAccountInfo` is present so non-AWS configs can
 * still be bundled.
 */
export const getLayerProvidedModules = (qpqConfig: QPQConfig): string[] => {
  const serviceAccountInfos = qpqCoreUtils.getConfigSettings<AwsServiceAccountInfoQPQConfigSetting>(
    qpqConfig,
    QPQAwsConfigSettingType.awsServiceAccountInfo,
  );

  return serviceAccountInfos.flatMap((serviceAccountInfo) => serviceAccountInfo.apiLayers.flatMap((layer) => layer.modules ?? []));
};

/**
 * Resolve the AWS hardening settings for a named virtual network. Falls back
 * to `defineAwsVirtualNetworkSettings(name)` when the config never declares
 * one, so every VPC gets the secure defaults (flow logs + free S3/DynamoDB
 * gateway endpoints) without opting in.
 */
export const getAwsVirtualNetworkSettings = (qpqConfig: QPQConfig, virtualNetworkName: string): AwsVirtualNetworkQPQConfigSetting => {
  const setting = qpqCoreUtils
    .getConfigSettings<AwsVirtualNetworkQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsVirtualNetworkSettings)
    .find((s) => s.virtualNetworkName === virtualNetworkName);

  return setting ?? defineAwsVirtualNetworkSettings(virtualNetworkName);
};

export const getAwsDataStoreRemovalPolicy = (qpqConfig: QPQConfig): AwsDataStoreRemovalPolicy => {
  const setting = qpqCoreUtils.getConfigSetting<AwsDataStoreRemovalPolicyQPQConfigSetting>(
    qpqConfig,
    QPQAwsConfigSettingType.awsDataStoreRemovalPolicy,
  );

  return setting?.removalPolicy ?? AwsDataStoreRemovalPolicy.retain;
};

export const getAwsBootstrapOrganizationConfigs = (qpqConfig: QPQConfig): AwsOrganizationQPQConfigSetting[] => {
  const awsOrganizationQPQConfigSettings = qpqCoreUtils.getConfigSettings<AwsOrganizationQPQConfigSetting>(
    qpqConfig,
    QPQAwsConfigSettingType.bootstrapAwsOrganization,
  );

  return awsOrganizationQPQConfigSettings;
};

export const getAccountBudgetConfigs = (qpqConfig: QPQConfig): AccountBudgetQPQConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<AccountBudgetQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.accountBudget);

/** Whether the account config declares the GitHub Actions OIDC provider. */
export const isAccountGithubOidcProviderDeclared = (qpqConfig: QPQConfig): boolean =>
  !!qpqCoreUtils.getConfigSetting(qpqConfig, QPQAwsConfigSettingType.accountGithubOidcProvider);

export const getAccountSecurityServicesConfig = (qpqConfig: QPQConfig): AccountSecurityServicesQPQConfigSetting | undefined =>
  qpqCoreUtils.getConfigSetting<AccountSecurityServicesQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.accountSecurityServices);

export const getAwsServiceDashboardConfig = (qpqConfig: QPQConfig): AwsServiceDashboardQPQConfigSetting | undefined =>
  qpqCoreUtils.getConfigSetting<AwsServiceDashboardQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsServiceDashboard);

/** The app's GitHub deploy role setting, null when the bootstrap config declares none. */
export const getAwsGithubDeployRoleConfig = (qpqConfig: QPQConfig): Nullable<AwsGithubDeployRoleQPQConfigSetting> =>
  qpqCoreUtils.getConfigSetting<AwsGithubDeployRoleQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsGithubDeployRole) ?? null;

/** The account's GitHub Actions OIDC provider; one per account, created by `qpq setup`. */
export const getGithubOidcProviderArn = (accountId: string): string => `arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com`;

export const getBootstrapWafConfig = (qpqConfig: QPQConfig): BootstrapWafQPQConfigSetting | undefined =>
  qpqCoreUtils.getConfigSetting<BootstrapWafQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.bootstrapWaf);

export const isWafProtectionEnabled = (qpqConfig: QPQConfig): boolean =>
  !!qpqCoreUtils.getConfigSetting(qpqConfig, QPQAwsConfigSettingType.wafProtection);

// The web acl arns are shared by naming convention (not by setting) because the bootstrap
// config that creates them and the service configs that attach them are separate arrays -
// both sides can derive this name from their own app/env/feature.
export const getWafWebAclArnSsmParameterName = (wafScope: 'regional' | 'cloudfront', qpqConfig: QPQConfig): string => {
  const application = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  const deploymentName = feature ? `${application}-${environment}-${feature}` : `${application}-${environment}`;

  return `/qpq/waf/web-acl-arn/${wafScope}/${deploymentName}`;
};

export const getAccountCloudTrailConfigs = (qpqConfig: QPQConfig): AccountCloudTrailQPQConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<AccountCloudTrailQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.accountCloudTrail);

export const getAwsServiceAccountInfos = (qpqConfig: QPQConfig): ServiceAccountInfo[] => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);

  const serviceInfos = [...awsServiceAccountInfoConfig.serviceInfoMap, getLocalServiceAccountInfo(qpqConfig)];

  const uniqueServices = serviceInfos.filter(
    (service, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.moduleName === service.moduleName &&
          t.applicationName === service.applicationName &&
          t.environment === service.environment &&
          t.feature === service.feature,
      ),
  );

  return uniqueServices;
};

export const getOwnedAwsAlarmConfigs = (qpqConfig: QPQConfig): AwsAlarmQPQConfigSetting[] => {
  const alarmConfigs = qpqCoreUtils.getConfigSettings<AwsAlarmQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsServiceAlarm);

  return qpqCoreUtils.getOwnedItems(alarmConfigs, qpqConfig);
};

/**
 * Direct SNS subscribers (email / webhook) declared for a given event bus.
 * Additive across calls. Pass the bus's `owner` (from its `defineEventBus`) to
 * disambiguate: an owner-tagged quick-sub binds only to the matching owner's bus,
 * while an owner-less one matches any bus with that name (simple single-service case).
 */
export const getEventBusQuickSubscriptions = (
  qpqConfig: QPQConfig,
  eventBusName: string,
  busOwner?: CrossModuleOwner,
): EventBusQuickSubscription[] => {
  return qpqCoreUtils
    .getConfigSettings<EventBusQuickSubscriptionQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsEventBusQuickSubscription)
    .filter((setting) => setting.eventBusName === eventBusName)
    .filter((setting) => !setting.owner || qpqCoreUtils.isSameCrossModuleOwner(setting.owner, busOwner))
    .flatMap((setting) => setting.subscriptions);
};

/** Sandbox recipient addresses, additive across calls. See defineEmailSenderAllowList for why this exists. */
export const getEmailSenderAllowedAddresses = (qpqConfig: QPQConfig): string[] => {
  return qpqCoreUtils
    .getConfigSettings<EmailSenderAllowListQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsEmailSenderAllowList)
    .flatMap((setting) => setting.allowedEmailAddresses);
};

export const getAwsAccountIds = (qpqConfig: QPQConfig): string[] => {
  const uniqueAccountIds: string[] = [...new Set(getAwsServiceAccountInfos(qpqConfig).map((accountInfo) => accountInfo.awsAccountId))];

  return uniqueAccountIds;
};

export const getLocalServiceAccountInfo = (qpqConfig: QPQConfig): LocalServiceAccountInfo => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);

  const serviceAccountInfo: LocalServiceAccountInfo = {
    moduleName: qpqCoreUtils.getApplicationModuleName(qpqConfig),
    applicationName: qpqCoreUtils.getApplicationName(qpqConfig),
    environment: qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
    feature: qpqCoreUtils.getApplicationModuleFeature(qpqConfig),

    awsAccountId: awsServiceAccountInfoConfig.deployAccountId,
    awsRegion: awsServiceAccountInfoConfig.deployRegion,
  };

  return serviceAccountInfo as LocalServiceAccountInfo;
};

export const getApplicationModuleDeployRegion = (qpqConfig: QPQConfig): string => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);
  return awsServiceAccountInfoConfig.deployRegion;
};

export const getApplicationModuleDeployAccountId = (qpqConfig: QPQConfig): string => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);
  return awsServiceAccountInfoConfig.deployAccountId;
};

export const resolveAwsServiceAccountInfo = (qpqConfig: QPQConfig, crossModuleOwner?: CrossModuleOwner): ServiceAccountInfo => {
  const localServiceInfo = getLocalServiceAccountInfo(qpqConfig);

  const targetModule: string = crossModuleOwner?.module || localServiceInfo.moduleName;
  const targetEnvironment: string = crossModuleOwner?.environment || localServiceInfo.environment;
  const targetApplication: string = crossModuleOwner?.application || localServiceInfo.applicationName;
  const targetFeature: string | undefined = crossModuleOwner?.feature || localServiceInfo.feature;

  return getAwsServiceAccountInfoByDeploymentInfo(qpqConfig, targetModule, targetEnvironment, targetFeature, targetApplication);
};

export const getAwsServiceAccountInfoByDeploymentInfo = (
  qpqConfig: QPQConfig,

  targetModule?: string,
  targetEnvironment?: string,
  targetFeature?: string,
  targetApplication?: string,
): ServiceAccountInfo => {
  const awsServiceAccountInfos = getAwsServiceAccountInfos(qpqConfig);

  const getMatchWeight = (serviceAccountInfo: ServiceAccountInfo) => {
    // Note: remember not to have overlapping weights
    return (
      1.8 * Number(!serviceAccountInfo.applicationName || serviceAccountInfo.applicationName === targetApplication) +
      1.4 * Number(!serviceAccountInfo.environment || serviceAccountInfo.environment === targetEnvironment) +
      1.2 * Number(!serviceAccountInfo.moduleName || serviceAccountInfo.moduleName === targetModule) +
      1.1 * Number(!serviceAccountInfo.feature || (serviceAccountInfo.feature === targetFeature && !serviceAccountInfo.feature === !targetFeature))
    );
  };

  const sortedAwsServiceAccountInfos = awsServiceAccountInfos
    .map((info) => ({ info, weight: getMatchWeight(info) }))
    .sort((a, b) => {
      const weightDiff = b.weight - a.weight;
      if (weightDiff !== 0) return weightDiff;
      return Object.keys(b.info).length - Object.keys(a.info).length;
    });

  // if (printInfo) {
  //   console.log(`getMatchWeight: targetModule: [${targetModule}], targetEnvironment: [${targetEnvironment}], targetFeature: [${targetFeature}], targetApplication: [${targetApplication}]`);
  //   console.log(JSON.stringify(sortedAwsServiceAccountInfos.slice(0, 5), null, 2));
  // }

  const serviceAccountInfo = sortedAwsServiceAccountInfos.find((info) => info.weight > 0);

  if (!serviceAccountInfo) {
    throw new Error(`No aws service account info found for ${targetModule} ${targetEnvironment} ${targetFeature}`);
  }

  return serviceAccountInfo.info;
};

export const isLambdaWarmingDisabled = (qpqConfig: QPQConfig): boolean => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);
  return awsServiceAccountInfoConfig.disableLambdaWarming;
};

export const isReservedConcurrencyDisabled = (qpqConfig: QPQConfig): boolean => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);
  return awsServiceAccountInfoConfig.disableReservedConcurrency;
};

export const isTracingDisabled = (qpqConfig: QPQConfig): boolean => {
  const awsServiceAccountInfoConfig = getAwsServiceAccountInfoConfig(qpqConfig);
  return awsServiceAccountInfoConfig.disableTracing;
};

export const getDomainCertificateConfigs = (qpqConfig: QPQConfig): DomainCertificateQPQConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<DomainCertificateQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsDomainCertificate);
};

/**
 * Keyed by app + environment (+ feature), never by domain: a cert covers every root, and
 * this namespace cannot collide with a retired per-domain stack's parameter.
 */
export const getDomainCertificateArnSsmParameterName = (region: string, qpqConfig: QPQConfig): string => {
  const application = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  return `/qpq/domain/certificate-arn/${region}/${[application, environment, feature].filter(Boolean).join('-')}`;
};

export const getAwsKmsKeys = (qpqConfig: QPQConfig): AwsKmsKeyQPQConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<AwsKmsKeyQPQConfigSetting>(qpqConfig, QPQAwsConfigSettingType.awsKmsKey);
};

export const getAwsKmsKeyForStorageDrive = (
  qpqConfig: QPQConfig,
  storageDriveConfig: StorageDriveQPQConfigSetting,
): AwsKmsKeyQPQConfigSetting | undefined => {
  const ownerModule = storageDriveConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return getAwsKmsKeys(qpqConfig).find(
    (k) => k.type === AwsKmsKeyTargetType.storageDrive && k.kmsOwner.name === storageDriveConfig.storageDrive && k.kmsOwner.module === ownerModule,
  );
};

export const getAwsKmsKeyForKeyValueStore = (
  qpqConfig: QPQConfig,
  kvsConfig: KeyValueStoreQPQConfigSetting,
): AwsKmsKeyQPQConfigSetting | undefined => {
  const ownerModule = kvsConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return getAwsKmsKeys(qpqConfig).find(
    (k) => k.type === AwsKmsKeyTargetType.keyValueStore && k.kmsOwner.name === kvsConfig.keyValueStoreName && k.kmsOwner.module === ownerModule,
  );
};

export const getDynamoTableNameOverrride = (srcKvsName: string, qpqConfig: QPQConfig): string => {
  // Get the key value store config
  const resource = qpqCoreUtils.getKeyValueStoreFullyQualifiedResourceName(srcKvsName, qpqConfig);

  // Grab all the overrides that do exist
  const dynamoOverrides = qpqCoreUtils.getConfigSettings<AwsDyanmoOverrideForKvsQPQConfigSetting>(
    qpqConfig,
    QPQAwsConfigSettingType.awsDyanmoOverrideForKvs,
  );

  // Find an override that matches the resource
  const dynamoOverride = dynamoOverrides.find((override) => qpqCoreUtils.isSameResource(resource, override.kvsStore));

  // If we found a matching resource, return the override
  if (dynamoOverride) {
    return dynamoOverride.dynamoTableName;
  }

  // No override found, return empty string
  return '';
};
