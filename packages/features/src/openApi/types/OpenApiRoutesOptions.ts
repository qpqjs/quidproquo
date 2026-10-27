import { OpenApiDocumentOptions, RouteAuthSettings } from 'quidproquo-webserver';

export type OpenApiRoutesOptions = {
  // Where the docs live, under the version prefix. Defaults to `/docs`; the raw
  // document is always served at `${basePath}/openapi.json`.
  basePath?: string;

  // Same versioning as every other route: the pages sit under `/v{version}`.
  version?: number;

  // Title, version and description for the document's info block
  info?: OpenApiDocumentOptions;

  // Leave undefined for public docs; set to gate them behind a user directory or api key
  routeAuthSettings?: RouteAuthSettings;
};
