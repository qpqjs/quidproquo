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
  // The domain resolver pointer is a QpqPureFunction, structurally an advanced runtime, so
  // the same loader bundles and serves it.
  const domainResolver = qpqCoreUtils.getConfigSetting<DnsQPQWebServerConfigSetting>(configs, QPQWebServerConfigSettingType.Dns)?.resolver;

  return qpqCoreUtils.expandSrcEntriesWithActionProcessors([
    ...getAllRoutes(configs).map((r) => r.runtime),
    ...getAllSeo(configs).map((seo) => seo.runtime),
    ...getAllServiceFunctions(configs).map((sf) => sf.runtime),
    ...getAllWebsocketSrcEntries(configs),
    ...(domainResolver ? [domainResolver] : []),
  ]);
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

export const getDefaultRouteSettings = (qpqConfig: QPQConfig): DefaultRouteOptionsQPQWebServerConfigSetting[] => {
  const defaultRouteSettings =
    qpqCoreUtils.getConfigSettings<DefaultRouteOptionsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.DefaultRouteOptions) || [];

  return defaultRouteSettings;
};

export const getEmailSenderSettings = (qpqConfig: QPQConfig): EmailSenderQPQWebServerConfigSetting[] => {
  return qpqCoreUtils.getConfigSettings<EmailSenderQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.EmailSender) || [];
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
