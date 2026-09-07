import { defineStorageDrive, HTTPMethod, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { RouteAuthSettings, RouteOptions } from 'quidproquo-webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { defineVersionedRoute } from '../../routes/defineVersionedRoute';
import { EVENT_DOC_TRANSFER_DRIVE_NAME } from '../constants';
import { buildEventDocTransferGlobals } from '../globals';
import { EventDocTransferCollectionSource, toEventDocTransferCollection } from './toEventDocTransferCollection';

/** Options for defineEventDocTransfer. */
export type EventDocTransferOptions = {
  // The service name EventDocLinks use for this service; a reference into another service throws.
  service: string;
  // Pass the same array the service feeds its defineEventDoc calls so the two cannot drift.
  collections: EventDocTransferCollectionSource[];
  // Scopes the whole request; needed here because a transfer spans collections. Omit only if none of them partition.
  scopeResolver?: string;
  // Import writes unvalidated history, so gate these routes harder than the collections' own.
  routeAuthSettings?: RouteAuthSettings;
  version?: number;
};

// At the api root, never below a collection: `{id}` matches any segment, so `/templates/transfer` would read as a doc id.
const TRANSFER_BASE_PATH = '/transfer';

/** The export/import surface for one service: a staging drive plus the manifest/export/upload/plan/import routes. */
export const defineEventDocTransfer = ({ service, collections, scopeResolver, routeAuthSettings, version }: EventDocTransferOptions): QPQConfig => {
  const globals: Record<string, unknown> = buildEventDocTransferGlobals({
    service,
    collections: collections.map(toEventDocTransferCollection),
    scopeResolver,
  });

  // askEventDocResolveUserId/Actor (which a tenant scope resolver calls on every request) read the directory off this global.
  if (routeAuthSettings?.userDirectoryName) {
    globals[EVENT_DOC_USER_DIRECTORY_GLOBAL] = routeAuthSettings.userDirectoryName;
  }

  const options: RouteOptions = routeAuthSettings ? { routeAuthSettings } : {};

  const runtime = (functionName: string): QpqFunctionRuntimeAdvanced => ({
    basePath: __dirname,
    relativePath: `../routes/controllers/${functionName}`,
    functionName,
    globals,
  });

  const route = (method: HTTPMethod, path: string, functionName: string): QPQConfig =>
    defineVersionedRoute(method, path, runtime(functionName), options, version);

  return [
    defineStorageDrive(EVENT_DOC_TRANSFER_DRIVE_NAME),

    route('POST', `${TRANSFER_BASE_PATH}/manifest`, 'manifest'),
    route('POST', `${TRANSFER_BASE_PATH}/export`, 'exportBundle'),
    route('POST', `${TRANSFER_BASE_PATH}/upload`, 'upload'),
    route('POST', `${TRANSFER_BASE_PATH}/plan`, 'plan'),
    route('POST', `${TRANSFER_BASE_PATH}/import`, 'importBundle'),
  ];
};
