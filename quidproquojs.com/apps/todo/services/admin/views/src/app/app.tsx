import {
  getApiUrl,
  getFederatedViewsUrl,
  getWebSocketUrl,
} from 'quidproquo-web';
import { App as QpqAdminApp } from 'quidproquo-web-admin';
import { BaseUrlResolvers } from 'quidproquo-web-react';

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
