import {
  getApiUrl,
  getFederatedViewsUrl,
  getWebSocketUrl,
} from 'quidproquo-web';
import { App as QpqAdminApp } from 'quidproquo-web-admin';
import { BaseUrlResolvers } from 'quidproquo-web-react';

import { QpqjsServiceEnum } from '@qpqjs/constants';

export const getApiBaseUrl = () => getApiUrl(QpqjsServiceEnum.Admin);

export const getWsBaseUrl = () =>
  getWebSocketUrl(QpqjsServiceEnum.Admin, 'qpqadmin');

export const getMFManifestBaseUrl = () =>
  getFederatedViewsUrl(QpqjsServiceEnum.Admin);

const urlResolvers: BaseUrlResolvers = {
  getApiUrl: getApiBaseUrl,
  getWsUrl: getWsBaseUrl,
  getMFManifestUrl: getMFManifestBaseUrl,
};

export function App() {
  return <QpqAdminApp urlResolvers={urlResolvers} />;
}

export default App;
