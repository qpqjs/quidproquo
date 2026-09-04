import { OpenApiParameter } from '../../types/OpenApiDocument';

// Route paths already use OpenAPI's `{param}` template syntax, so the path itself
// is the source of truth for path parameters. They are always strings on the wire.
export const buildOpenApiPathParameters = (path: string): OpenApiParameter[] =>
  [...path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
