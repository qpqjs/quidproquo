import { DynamicRouteKnownErrors } from './DynamicRouteKnownErrors';
import { DynamicRouteSchema } from './DynamicRouteSchema';

// Everything about a dynamic route that isn't its method/path or its handler.
export type DynamicRouteConfig<TBody = undefined, TQuery = undefined> = {
  // Error types the handler is expected to throw, mapped to the status they become
  knownErrors?: DynamicRouteKnownErrors;

  // Request/response contract, parsed before the handler and published to OpenAPI
  schema?: DynamicRouteSchema<TBody, TQuery>;
};
