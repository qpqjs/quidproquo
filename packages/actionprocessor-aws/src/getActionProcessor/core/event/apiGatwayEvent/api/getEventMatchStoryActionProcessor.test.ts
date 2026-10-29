import { ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineRoute } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const MODULE_NAME = 'test-module';

const buildApiGatewayEvent = (overrides: Record<string, any> = {}): any => ({
  path: `/${MODULE_NAME}/users`,
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false,
  multiValueQueryStringParameters: null,
  queryStringParameters: null,
  requestContext: { identity: { sourceIp: '1.2.3.4' } },
  ...overrides,
});

const context = { awsRequestId: 'req-1' } as any;

describe('apiGatwayEvent/api getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no route matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { path: '/missing', method: 'GET', headers: {} } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('matches the request to a configured route', async () => {
    const runtime: QpqFunctionRuntime = '/entry/handler::handler';
    const config = buildTestQpqConfig([defineRoute('GET', '/users', runtime, { allowedOrigins: [] })]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/users', method: 'GET', headers: {} } });

    expect((match as any).runtime).toEqual(runtime);
  });

  it('decodes route params before handing them to the story', async () => {
    const runtime: QpqFunctionRuntime = '/entry/handler::handler';
    const config = buildTestQpqConfig([defineRoute('GET', '/log/{id}', runtime, { allowedOrigins: [] })]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/log/svc%3A%3A1', method: 'GET', headers: {} } });
    const [, error] = await processor({ qpqEventRecord: { path: '/log/%E0', method: 'GET', headers: {} } });

    expect((match as any).runtimeOptions).toEqual({ id: 'svc::1' });
    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  // Security regression: the matcher compares the raw path, so dot segments or encoded slashes never fold a request
  // onto a different route.
  it('never matches a route through dot segments or encoded separators', async () => {
    const runtime: QpqFunctionRuntime = '/entry/handler::handler';
    const config = buildTestQpqConfig([defineRoute('GET', '/users', runtime, { allowedOrigins: [] })]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    for (const path of ['/public/../users', '/users/..', '/public/..%2Fusers', '/%2Fusers']) {
      const [, error] = await processor({ qpqEventRecord: { path, method: 'GET', headers: {} } });

      expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
    }
  });
});
