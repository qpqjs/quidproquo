export type BaseUrlResolver = () => string;
export type BaseUrlResolvers = {
  getApiUrl: BaseUrlResolver;
  getWsUrl: BaseUrlResolver;
  getMFManifestUrl: BaseUrlResolver;
};
