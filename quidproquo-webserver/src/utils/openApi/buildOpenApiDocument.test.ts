import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineApi } from '../../config/settings/api';
import { defineDefaultRouteOptions } from '../../config/settings/defaultRouteOptions';
import { defineDns } from '../../config/settings/dns';
import { defineRoute } from '../../config/settings/route';
import { buildOpenApiDocument } from './buildOpenApiDocument';
import { OPEN_API_API_KEY_AUTH, OPEN_API_BEARER_AUTH } from './openApiSecuritySchemeNames';

const bodySchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
const querySchema = {
  type: 'object',
  properties: { limit: { type: 'number', description: 'Page size' }, cursor: { type: 'string' } },
  required: ['limit'],
};

describe('buildOpenApiDocument', () => {
  it('describes each route as an operation keyed by path and verb', () => {
    const config = buildTestQpqConfig([
      defineRoute('GET', '/v1/widgets', '/src/widgets::list'),
      defineRoute('POST', '/v1/widgets', '/src/widgets::create', { schema: { summary: 'Create', tags: ['widgets'], bodyJsonSchema: bodySchema } }),
      defineRoute('GET', '/v1/widgets/{id}', '/src/widgets::get', { schema: { responseJsonSchema: { type: 'object' } } }),
    ]);

    const document = buildOpenApiDocument(config);

    expect(document.openapi).toBe('3.1.0');
    expect(document.info).toEqual({ title: 'test-app test-module', version: '1.0.0', description: undefined });
    expect(Object.keys(document.paths)).toEqual(['/v1/widgets', '/v1/widgets/{id}']);

    const list = document.paths['/v1/widgets'].get;
    expect(list?.operationId).toBe('get_v1_widgets');
    expect(list?.responses).toEqual({ '200': { description: 'Success' } });
    expect(list?.parameters).toBeUndefined();
    expect(list?.requestBody).toBeUndefined();

    const create = document.paths['/v1/widgets'].post;
    expect(create).toMatchObject({ summary: 'Create', tags: ['widgets'], operationId: 'post_v1_widgets' });
    expect(create?.requestBody).toEqual({ required: true, content: { 'application/json': { schema: bodySchema } } });
    expect(create?.responses['422']).toBeDefined();

    const get = document.paths['/v1/widgets/{id}'].get;
    expect(get?.operationId).toBe('get_v1_widgets_id');
    expect(get?.parameters).toEqual([{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]);
    expect(get?.responses['200']).toEqual({ description: 'Success', content: { 'application/json': { schema: { type: 'object' } } } });
  });

  it('unpacks a query object schema into one parameter per property', () => {
    const config = buildTestQpqConfig([defineRoute('GET', '/v1/widgets', '/src/widgets::list', { schema: { queryJsonSchema: querySchema } })]);

    const parameters = buildOpenApiDocument(config).paths['/v1/widgets'].get?.parameters;

    expect(parameters).toEqual([
      { name: 'limit', in: 'query', required: true, schema: querySchema.properties.limit, description: 'Page size' },
      { name: 'cursor', in: 'query', required: false, schema: querySchema.properties.cursor, description: undefined },
    ]);
  });

  it('derives security from merged auth settings and only publishes the schemes in use', () => {
    const config = buildTestQpqConfig([
      defineDefaultRouteOptions('default', { routeAuthSettings: { userDirectoryName: 'users', scopes: ['read'] } }),
      defineRoute('GET', '/v1/me', '/src/me::get'),
      defineRoute('POST', '/v1/hook', '/src/hook::post', { routeAuthSettings: { apiKeys: ['partner'] } }),
    ]);

    const document = buildOpenApiDocument(config);

    expect(document.paths['/v1/me'].get?.security).toEqual([{ [OPEN_API_BEARER_AUTH]: ['read'] }]);
    expect(document.paths['/v1/me'].get?.responses['401']).toBeDefined();
    expect(document.paths['/v1/hook'].post?.security).toEqual([{ [OPEN_API_BEARER_AUTH]: ['read'] }, { [OPEN_API_API_KEY_AUTH]: [] }]);
    expect(Object.keys(document.components.securitySchemes).sort()).toEqual([OPEN_API_API_KEY_AUTH, OPEN_API_BEARER_AUTH]);
  });

  it('publishes no security schemes when nothing uses them', () => {
    const config = buildTestQpqConfig([defineRoute('GET', '/health', '/src/health::get')]);

    const document = buildOpenApiDocument(config);

    expect(document.paths['/health'].get?.security).toBeUndefined();
    expect(document.components.securitySchemes).toEqual({});
  });

  it('skips hidden routes', () => {
    const config = buildTestQpqConfig([
      defineRoute('GET', '/v1/docs', '/src/docs::page', { schema: { hidden: true } }),
      defineRoute('GET', '/v1/widgets', '/src/widgets::list'),
    ]);

    expect(Object.keys(buildOpenApiDocument(config).paths)).toEqual(['/v1/widgets']);
  });

  it('lists a server per live api, mounted under the service name, none without a domain', () => {
    const withDomain = buildTestQpqConfig([
      defineDns('example.com'),
      defineApi('api', 'example.com'),
      defineApi('old', 'example.com', { deprecated: true }),
    ]);

    expect(buildOpenApiDocument(withDomain).servers).toEqual([{ url: 'https://api.development.example.com/test-module' }]);
    expect(buildOpenApiDocument(buildTestQpqConfig()).servers).toEqual([]);
  });

  it('takes info overrides from the options', () => {
    const document = buildOpenApiDocument(buildTestQpqConfig(), { title: 'Widgets', version: '2.0.0', description: 'All the widgets' });

    expect(document.info).toEqual({ title: 'Widgets', version: '2.0.0', description: 'All the widgets' });
  });
});
