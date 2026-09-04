import { JsonSchema } from '../../config/types/JsonSchema';
import { OpenApiParameter } from '../../types/OpenApiDocument';

const isJsonSchema = (value: unknown): value is JsonSchema => typeof value === 'object' && value !== null;

// A query schema is declared as one object schema, but OpenAPI wants one parameter
// per key. Only the top-level properties can be unpacked; a query schema that is
// not an object (or has none) contributes nothing rather than something wrong.
export const buildOpenApiQueryParameters = (querySchema?: JsonSchema): OpenApiParameter[] => {
  const properties = querySchema?.properties;
  if (!isJsonSchema(properties)) {
    return [];
  }

  const required = Array.isArray(querySchema?.required) ? (querySchema.required as string[]) : [];

  return Object.entries(properties)
    .filter((entry): entry is [string, JsonSchema] => isJsonSchema(entry[1]))
    .map(([name, schema]) => ({
      name,
      in: 'query',
      required: required.includes(name),
      schema,
      description: typeof schema.description === 'string' ? schema.description : undefined,
    }));
};
