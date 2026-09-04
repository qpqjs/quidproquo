import { JsonSchema, RouteSchema } from 'quidproquo-webserver';

import { z } from 'zod/v4';

import { DynamicRouteSchema } from './DynamicRouteSchema';

// Request schemas document what the caller sends, so defaults and coercions are
// described from the input side; the response is what the handler produces.
const toJsonSchema = (schema: z.ZodType, io: 'input' | 'output'): JsonSchema => {
  // The `$schema` marker is noise once the schema is embedded in an OpenAPI document
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, { io });

  return jsonSchema;
};

// Only declared parts make it onto the config. An explicit `undefined` would
// clobber a value already sitting on the route options when the two are spread.
const definedEntries = (schema: RouteSchema): RouteSchema => Object.fromEntries(Object.entries(schema).filter(([, value]) => value !== undefined));

// Flatten a zod route schema into the plain-data RouteSchema that lives on the
// route config. The config is written out as JSON by `qpq synth`, so nothing
// with a validator on it can survive past this point.
export const toRouteSchema = (schema: DynamicRouteSchema<unknown, unknown>): RouteSchema =>
  definedEntries({
    summary: schema.summary,
    description: schema.description,
    tags: schema.tags,

    bodyJsonSchema: schema.body && toJsonSchema(schema.body, 'input'),
    queryJsonSchema: schema.query && toJsonSchema(schema.query, 'input'),
    responseJsonSchema: schema.response && toJsonSchema(schema.response, 'output'),
  });
