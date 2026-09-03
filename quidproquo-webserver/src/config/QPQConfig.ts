export enum QPQWebServerConfigSettingType {
  Route = '@quidproquo-webserver/config/Route',
  DefaultRouteOptions = '@quidproquo-webserver/config/DefaultRouteOptions',
  Dns = '@quidproquo-webserver/config/Dns',
  EmailSender = '@quidproquo-webserver/config/EmailSender',
  Seo = '@quidproquo-webserver/config/Seo',
  SubdomainRedirect = '@quidproquo-webserver/config/SubdomainRedirect',
  WebEntry = '@quidproquo-webserver/config/WebEntry',
  Api = '@quidproquo-webserver/config/Api',
  ApiKey = '@quidproquo-webserver/config/ApiKey',
  ServiceFunction = '@quidproquo-webserver/config/ServiceFunction',
  WebSocket = '@quidproquo-webserver/config/WebSocket',
  Cache = '@quidproquo-webserver/config/Cache',
  Certificate = '@quidproquo-webserver/config/Certificate',
  DomainProxy = '@quidproquo-webserver/config/DomainProxy',
  StorageDriveCorsSettings = '@quidproquo-webserver/config/StorageDriveCorsSettings',
  FileUploadSettings = '@quidproquo-webserver/config/FileUploadSettings',
}

// TODO: move this somewhere better
export interface CacheSettings {
  minTTLInSeconds: number;
  maxTTLInSeconds: number;
  defaultTTLInSeconds: number;
  mustRevalidate: boolean;
}
