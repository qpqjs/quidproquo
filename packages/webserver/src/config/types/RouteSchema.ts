import { JsonSchema } from './JsonSchema';

// The self-documenting half of a route: what it accepts and what it returns, as
// JSON Schema, plus the bits of prose an OpenAPI operation wants. Everything is
// optional so a route with no schema still shows up in the generated document,
// just without bodies.
export type RouteSchema = {
  // Leave the route out of the generated OpenAPI document (the docs endpoints themselves, internal hooks)
  hidden?: boolean;

  summary?: string;
  description?: string;
  tags?: string[];

  bodyJsonSchema?: JsonSchema;
  queryJsonSchema?: JsonSchema;
  responseJsonSchema?: JsonSchema;
};
