import { QpqjsServiceEnum } from '@qpqjs/constants';
import { getApiUrl, getFederatedViewsUrl, getWebSocketUrl } from '@qpqjs/web';
import { App as QpqAdminApp } from '@qpqjs/web-admin';
import { BaseUrlResolvers } from '@qpqjs/web-react';

export const getApiBaseUrl = () => getApiUrl(QpqjsServiceEnum.Admin);

export const getWsBaseUrl = () => getWebSocketUrl(QpqjsServiceEnum.Admin, 'qpqadmin');

export const getMFManifestBaseUrl = () => getFederatedViewsUrl(QpqjsServiceEnum.Admin);

const urlResolvers: BaseUrlResolvers = {
  getApiUrl: getApiBaseUrl,
  getWsUrl: getWsBaseUrl,
  getMFManifestUrl: getMFManifestBaseUrl,
};

export function App() {
  return <QpqAdminApp urlResolvers={urlResolvers} />;
}

export default App;
