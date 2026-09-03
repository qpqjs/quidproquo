import { isDefined, QPQConfig, qpqCoreUtils, QpqFunctionRuntime } from 'quidproquo-core';

import {
  ApiKeyQPQWebServerConfigSetting,
  CacheQPQWebServerConfigSetting,
  CertificateQPQWebServerConfigSetting,
  DefaultRouteOptionsQPQWebServerConfigSetting,
  DnsQPQWebServerConfigSetting,
  DomainProxyQPQWebServerConfigSetting,
  EmailSenderQPQWebServerConfigSetting,
  FileUploadSettings,
  FileUploadSettingsQPQWebServerConfigSetting,
  QPQWebServerConfigSettingType,
  RouteQPQWebServerConfigSetting,
  SeoQPQWebServerConfigSetting,
  ServiceFunctionQPQWebServerConfigSetting,
  StorageDriveCorsSettingsQPQWebServerConfigSetting,
  SubdomainRedirectQPQWebServerConfigSetting,
  WebSocketQPQWebServerConfigSetting,
} from '../config';
import { ApiQPQWebServerConfigSetting, WebEntryQPQWebServerConfigSetting } from '../config';

export const getAllRoutes = (qpqConfig: QPQConfig): RouteQPQWebServerConfigSetting[] => {
  const routes = qpqCoreUtils.getConfigSettings<RouteQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Route);

  return routes;
};

export const getAllRoutesForApi = (apiName: string, qpqConfig: QPQConfig): RouteQPQWebServerConfigSetting[] => {
  const routes = getAllRoutes(qpqConfig);

  return routes;
};

export const getAllApiKeyConfigs = (qpqConfig: QPQConfig): ApiKeyQPQWebServerConfigSetting[] => {
  const apiKeyConfigs = qpqCoreUtils.getConfigSettings<ApiKeyQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.ApiKey);

  return apiKeyConfigs;
};

export const getAllSeo = (qpqConfig: QPQConfig): SeoQPQWebServerConfigSetting[] => {
  const seoConfigs = qpqCoreUtils.getConfigSettings<SeoQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Seo);

  return seoConfigs;
};

export const getAllServiceFunctions = (qpqConfig: QPQConfig): ServiceFunctionQPQWebServerConfigSetting[] => {
  const serviceFunctions = qpqCoreUtils.getConfigSettings<ServiceFunctionQPQWebServerConfigSetting>(
    qpqConfig,
    QPQWebServerConfigSettingType.ServiceFunction,
  );

  return serviceFunctions;
};

export const getOwnedServiceFunctions = (qpqConfig: QPQConfig): ServiceFunctionQPQWebServerConfigSetting[] => {
  const serviceFunctions = getAllServiceFunctions(qpqConfig);

  return qpqCoreUtils.getOwnedItems(serviceFunctions, qpqConfig);
};

export const getAllWebsocketSrcEntries = (qpqConfig: QPQConfig): QpqFunctionRuntime[] => {
  return getOwnedWebsocketSettings(qpqConfig)
    .flatMap((s) => [s.eventProcessors.onConnect, s.eventProcessors.onDisconnect, s.eventProcessors.onMessage])
    .filter(isDefined);
};

// Used in bundlers to know where and what to build and index
// Events, routes, etc
export const getAllSrcEntries = (configs: QPQConfig): QpqFunctionRuntime[] => {
  return qpqCoreUtils.expandSrcEntriesWithActionProcessors([
    ...getAllRoutes(configs).map((r) => r.runtime),
    ...getAllSeo(configs).map((seo) => seo.runtime),
    ...getAllServiceFunctions(configs).map((sf) => sf.runtime),
    ...getAllWebsocketSrcEntries(configs),
  ]);
};

export const getDomainName = (configs: QPQConfig): string => {
  const dnsSettings = qpqCoreUtils.getConfigSetting<DnsQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.Dns);

  return dnsSettings?.dnsBase || '';
};

export const getWebEntry = (configs: QPQConfig): string => {
  const webEntry = qpqCoreUtils.getConfigSetting<WebEntryQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.WebEntry);

  if (!webEntry?.buildPath) {
    throw new Error('please use defineWebEntry in your qpq config');
  }

  return webEntry?.buildPath;
};

export const getWebsocketEntryByApiName = (apiName: string, qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting => {
  const websocketSettings = getWebsocketSettings(qpqConfig);

  const websocketSetting = websocketSettings.find((s) => s.apiName === apiName);

  if (!websocketSetting) {
    throw new Error(`No websocket setting found for api [${apiName}]`);
  }

  return websocketSetting;
};

export const getSubdomainRedirects = (configs: QPQConfig): SubdomainRedirectQPQWebServerConfigSetting[] => {
  const subdomainRedirects = qpqCoreUtils.getConfigSettings<SubdomainRedirectQPQWebServerConfigSetting>(
    configs,
    QPQWebServerConfigSettingType.SubdomainRedirect,
  );

  return subdomainRedirects;
};

export const getApiConfigs = (configs: QPQConfig): ApiQPQWebServerConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<ApiQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.Api);
};

export const getDnsConfigs = (configs: QPQConfig): DnsQPQWebServerConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<DnsQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.Dns);
};

export const getWebEntryConfigs = (configs: QPQConfig): WebEntryQPQWebServerConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<WebEntryQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.WebEntry);
};

export const getDomainProxyConfigs = (configs: QPQConfig): DomainProxyQPQWebServerConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<DomainProxyQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.DomainProxy);
};

export const getAllOwnedCacheConfigs = (qpqConfig: QPQConfig): CacheQPQWebServerConfigSetting[] => {
  const cacheSettings = qpqCoreUtils.getConfigSettings<CacheQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Cache);

  return qpqCoreUtils.getOwnedItems(cacheSettings, qpqConfig);
};

export const getAllOwnedCertifcateConfigs = (qpqConfig: QPQConfig): CertificateQPQWebServerConfigSetting[] => {
  const certificateSettings = qpqCoreUtils.getConfigSettings<CertificateQPQWebServerConfigSetting>(
    qpqConfig,
    QPQWebServerConfigSettingType.Certificate,
  );

  return qpqCoreUtils.getOwnedItems(certificateSettings, qpqConfig);
};

export const getCacheConfigByName = (cacheConfigName: string, qpqConfig: QPQConfig): CacheQPQWebServerConfigSetting => {
  const cacheSetting = qpqCoreUtils
    .getConfigSettings<CacheQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Cache)
    .find((c) => c.name === cacheConfigName);

  if (!cacheSetting) {
    throw new Error(`No cache config found for name [${cacheConfigName}]`);
  }

  return cacheSetting;
};

export const getEnvironmentDomainName = (configs: QPQConfig): string => {
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(configs);
  const apexDomainName = getDomainName(configs);

  if (environment === 'production') {
    return apexDomainName;
  }

  return `${environment}.${apexDomainName}`;
};

export const getBaseDomainName = (qpqConfig: QPQConfig): string => {
  const environmentDomain = getEnvironmentDomainName(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  if (feature) {
    return `${feature}.${environmentDomain}`;
  }

  return environmentDomain;
};

export const getServiceDomainName = (qpqConfig: QPQConfig): string => {
  const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const domainBase = getBaseDomainName(qpqConfig);

  return `${service}.${domainBase}`;
};

/**
 * Resolve browser CORS origins for a service resource. An explicit list wins;
 * otherwise scope to this service's own domain (apex + one-level subdomain
 * wildcard, which S3/CloudFront both support). Falls back to '*' only when the
 * service declares no domain at all (nothing browser-facing).
 *
 * Note: key off the raw dns base (`getDomainName`) to detect "no domain" —
 * `getBaseDomainName` still returns an env prefix like `development.` here.
 */
export const resolveServiceScopedCorsAllowedOrigins = (qpqConfig: QPQConfig, explicitOrigins?: string[]): string[] => {
  if (explicitOrigins) {
    return explicitOrigins;
  }

  if (!getDomainName(qpqConfig)) {
    return ['*'];
  }

  const baseDomain = getBaseDomainName(qpqConfig);
  return [`https://${baseDomain}`, `https://*.${baseDomain}`];
};

/**
 * Browser origins allowed to read/write a storage drive's objects cross-origin
 * (e.g. presigned uploads/downloads), looked up by the drive's name. An explicit
 * `defineStorageDriveCorsSettings` wins; otherwise the service-scoped default.
 */
export const getStorageDriveCorsAllowedOrigins = (qpqConfig: QPQConfig, storageDriveName: string): string[] => {
  const corsSetting = qpqCoreUtils
    .getConfigSettings<StorageDriveCorsSettingsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.StorageDriveCorsSettings)
    .find((setting) => setting.storageDriveName === storageDriveName);

  return resolveServiceScopedCorsAllowedOrigins(qpqConfig, corsSetting?.allowedOrigins);
};

/**
 * Whether any web entry in this service serves its assets from the named storage
 * drive (`storageDrive.sourceStorageDrive`) — i.e. the drive's bucket is a
 * CloudFront origin. Drives with no web entry consumer need no CloudFront access
 * to their bucket at all.
 */
export const isStorageDriveWebEntryOrigin = (qpqConfig: QPQConfig, storageDriveName: string): boolean => {
  return getWebEntryConfigs(qpqConfig).some((webEntry) => webEntry.storageDrive.sourceStorageDrive === storageDriveName);
};

// API Gateway caps request payloads at 10MB, so the default per-file ceiling matches it;
// the other defaults exist to bound parser memory rather than to be hit in practice.
export const defaultFileUploadSettings: FileUploadSettings = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFileCount: 10,
  maxFieldCount: 100,
  maxFieldSizeBytes: 1024 * 1024,
};

export const getFileUploadSettings = (qpqConfig: QPQConfig): FileUploadSettings => {
  const setting = qpqCoreUtils.getConfigSetting<FileUploadSettingsQPQWebServerConfigSetting>(
    qpqConfig,
    QPQWebServerConfigSettingType.FileUploadSettings,
  );

  return {
    ...defaultFileUploadSettings,
    ...Object.fromEntries(Object.entries(setting?.fileUploadSettings || {}).filter(([, value]) => isDefined(value))),
  };
};

export const resolveApexDomainNameFromDomainConfig = (qpqConfig: QPQConfig, rootDomain: string, onRootDomain: boolean): string => {
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);

  const apexDomain = onRootDomain
    ? getDomainRoot(rootDomain, environment, feature)
    : constructServiceDomainName(rootDomain, environment, qpqCoreUtils.getApplicationModuleName(qpqConfig), feature);

  return apexDomain;
};

export const constructServiceDomainName = (rootDomain: string, environment: string, service: string, feature?: string) => {
  const domainBase = getDomainRoot(rootDomain, environment, feature);

  return `${service}.${domainBase}`;
};

export const constructEnvironmentDomainName = (environment: string, domain: string): string => {
  if (environment === 'production') {
    return domain;
  }

  return `${environment}.${domain}`;
};

export const getDefaultRouteSettings = (qpqConfig: QPQConfig): DefaultRouteOptionsQPQWebServerConfigSetting[] => {
  const defaultRouteSettings =
    qpqCoreUtils.getConfigSettings<DefaultRouteOptionsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.DefaultRouteOptions) || [];

  return defaultRouteSettings;
};

export const getDomainRoot = (rootDomain: string, environment: string, feature?: string): string => {
  let domainPrefix = environment !== 'production' ? `${environment}.` : '';
  if (feature) {
    domainPrefix = `${feature}.${domainPrefix}`;
  }

  return `${domainPrefix}${rootDomain}`;
};

export const resolveDomainRoot = (rootDomain: string, qpqConfig: QPQConfig): string => {
  const domain = getDomainRoot(
    rootDomain,
    qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
    qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
  );

  return domain;
};

export const getEmailSenderSettings = (qpqConfig: QPQConfig): EmailSenderQPQWebServerConfigSetting[] => {
  const emailSenderSettings =
    qpqCoreUtils.getConfigSettings<EmailSenderQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.EmailSender) || [];

  return emailSenderSettings;
};

export const getWebsocketSettings = (qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting[] => {
  const websocketSettings =
    qpqCoreUtils.getConfigSettings<WebSocketQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.WebSocket) || [];

  return websocketSettings;
};

export const getOwnedWebsocketSettings = (qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting[] => {
  const websocketSettings = getWebsocketSettings(qpqConfig);

  return qpqCoreUtils.getOwnedItems(websocketSettings, qpqConfig);
};
