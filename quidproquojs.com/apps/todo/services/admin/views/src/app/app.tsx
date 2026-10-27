import {
  getApiUrl,
  getFederatedViewsUrl,
  getWebSocketUrl,
} from '@qpqjs/web';
import { App as QpqAdminApp } from '@qpqjs/web-admin';
import { BaseUrlResolvers } from '@qpqjs/web-react';

import { TodoServiceEnum } from '@todo/constants';

export const getApiBaseUrl = () => getApiUrl(TodoServiceEnum.Admin);

export const getWsBaseUrl = () =>
  getWebSocketUrl(TodoServiceEnum.Admin, 'qpqadmin');

export const getMFManifestBaseUrl = () =>
  getFederatedViewsUrl(TodoServiceEnum.Admin);

const urlResolvers: BaseUrlResolvers = {
  getApiUrl: getApiBaseUrl,
  getWsUrl: getWsBaseUrl,
  getMFManifestUrl: getMFManifestBaseUrl,
};

export function App() {
  return <QpqAdminApp urlResolvers={urlResolvers} />;
}

export default App;
