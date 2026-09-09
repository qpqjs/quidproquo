import { RouteAuthSettings } from 'quidproquo-webserver';

import { EventDocRouteName } from './EventDocRouteName';

/** Options for defineEventDocRoutes. */
export type EventDocRoutesOptions = {
  // Must match a `defineEventDocSummary` in the same service.
  storeName: string;
  type: string;
  // Nothing else may mount a literal under it: `${basePath}/{id}` matches any single segment.
  basePath: `/${string}`;
  // Routes to leave unmounted, for a collection that must own one itself.
  excludeRoutes?: EventDocRouteName[];
  // Omit to leave routes open; mutations then have no user to attribute.
  routeAuthSettings?: RouteAuthSettings;
  version?: number;
  // Inline-function name invoked with EventDocOnPublishInput after a Publish event lands. Errors propagate; the event stays.
  onPublish?: string;
  // Inline-function name invoked with EventDocOnAppendInput after every event lands, after onPublish. Errors propagate; the event stays.
  onAppend?: string;
  // Inline-function name invoked with `{ event }` before each route; a non-null result is the request's storage scope.
  scopeResolver?: string;
};
