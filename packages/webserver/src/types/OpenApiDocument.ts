import { JsonSchema } from '../config/types/JsonSchema';

// The slice of OpenAPI 3.1 this framework emits. Anything the generator does not
// produce (callbacks, links, examples) is deliberately absent rather than typed loosely.
export type OpenApiParameter = {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  schema: JsonSchema;
  description?: string;
};

export type OpenApiMediaType = { schema: JsonSchema };

export type OpenApiRequestBody = {
  required: boolean;
  content: { 'application/json': OpenApiMediaType };
};

export type OpenApiResponse = {
  description: string;
  content?: { 'application/json': OpenApiMediaType };
};

export type OpenApiSecurityRequirement = Record<string, string[]>;

export type OpenApiOperation = {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  security?: OpenApiSecurityRequirement[];
};

export type OpenApiPathItem = Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head', OpenApiOperation>>;

export type OpenApiSecurityScheme = { type: 'http'; scheme: 'bearer'; bearerFormat: 'JWT' } | { type: 'apiKey'; in: 'header'; name: string };

export type OpenApiInfo = {
  title: string;
  version: string;
  description?: string;
};

export type OpenApiDocument = {
  openapi: '3.1.0';
  info: OpenApiInfo;
  servers: { url: string }[];
  paths: Record<string, OpenApiPathItem>;
  components: {
    securitySchemes: Record<string, OpenApiSecurityScheme>;
  };
};
