import { HTTPMethod, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { RouteOptions } from 'quidproquo-webserver';

import { defineVersionedRoute } from '../../routes/defineVersionedRoute';
import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../constants/eventDocGlobalNames';
import { buildEventDocStore } from '../context/buildEventDocStore';
import { buildEventDocStoreGlobals } from '../globals/buildEventDocStoreGlobals';
import { EventDocRouteName } from '../types/EventDocRouteName';
import { EventDocRoutesOptions } from '../types/EventDocRoutesOptions';

/** The CRUD/event/asset routes for one collection. Controllers ship in this package and read the store from per-route globals. */
export const defineEventDocRoutes = ({
  storeName,
  type,
  basePath,
  routeAuthSettings,
  version,
  onPublish,
  onAppend,
  scopeResolver,
  excludeRoutes = [],
}: EventDocRoutesOptions): QPQConfig => {
  const store = buildEventDocStore({
    storeName,
    type,
    onPublish,
    onAppend,
    scopeResolver,
  });

  const globals: Record<string, unknown> = buildEventDocStoreGlobals(store);

  if (routeAuthSettings?.userDirectoryName) {
    globals[EVENT_DOC_USER_DIRECTORY_GLOBAL] = routeAuthSettings.userDirectoryName;
  }

  const options: RouteOptions = routeAuthSettings ? { routeAuthSettings } : {};

  const runtime = (functionName: string): QpqFunctionRuntimeAdvanced => ({
    basePath: __dirname,
    relativePath: `./controllers/${functionName}`,
    functionName,
    globals,
  });

  const route = (method: HTTPMethod, path: string, functionName: string): QPQConfig =>
    defineVersionedRoute(method, path, runtime(functionName), options, version);

  const allRoutes: [HTTPMethod, string, EventDocRouteName][] = [
    ['GET', basePath, 'list'],
    ['GET', `${basePath}/{id}`, 'get'],
    ['GET', `${basePath}/{id}/events`, 'listEvents'],
    ['GET', `${basePath}/{id}/render`, 'render'],
    ['GET', `${basePath}/{id}/references`, 'references'],
    ['POST', basePath, 'create'],
    ['POST', `${basePath}/{id}/events`, 'appendEvent'],
    ['POST', `${basePath}/{id}/assets`, 'createAsset'],
    ['GET', `${basePath}/{id}/assets/{assetId}`, 'getAsset'],
    ['GET', `${basePath}/{id}/assets`, 'listAssets'],
    ['DELETE', `${basePath}/{id}`, 'remove'],
  ];

  return allRoutes.filter(([, , name]) => !excludeRoutes.includes(name)).map(([method, path, name]) => route(method, path, name));
};
