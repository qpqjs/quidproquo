import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineRoute } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

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

describe('apiGatwayEvent/api getEventTransformResponseResultActionProcessor', () => {
  it('maps a successful record to an api gateway result with cors headers', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: 'ok', headers: { 'x-custom': 'v' }, isBase64Encoded: false } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(200);
    expect((response as any).body).toBe('ok');
    expect((response as any).headers['x-custom']).toBe('v');
    expect((response as any).headers['Access-Control-Allow-Headers']).toBe('Authorization, Content-Type');
  });

  it('returns an empty body for HEAD requests', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: 'ok', headers: {} } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent({ httpMethod: 'HEAD' }), context], qpqEventRecordResponses: [record] });

    expect((response as any).body).toBe('');
  });

  it('transforms an error record into the mapped http status code', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'nope' } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(404);
    expect(JSON.parse((response as any).body)).toEqual({ errorType: ErrorTypeEnum.NotFound, errorText: 'nope' });
  });

  // Security regression: the stack stays in the log; a caller only ever sees the error type and text.
  it('never sends an error stack or stack frames to the caller', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const error = {
      errorType: ErrorTypeEnum.GenericError,
      errorText: 'An unexpected error occurred [TypeError].',
      errorStack: 'TypeError: x\n    at handler (/var/task/index.js:1:1)',
    };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [{ success: false, error }] });

    const body = JSON.parse((response as any).body);
    expect((response as any).statusCode).toBe(500);
    expect(Object.keys(body).sort()).toEqual(['errorText', 'errorType']);
    expect((response as any).body).not.toMatch(/\n\s+at /);
  });

  it("answers with the matched route's own allowed origin, as its preflight does", async () => {
    const config = buildTestQpqConfig([
      defineRoute('POST', '/signer/session', '/entry/handler::handler', { allowedOrigins: ['https://sign.example.com'] }),
    ]);
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);
    const record = { success: true, result: { status: 200, body: 'ok', headers: {} } };
    const fromSigningSite = (path: string) =>
      processor({
        eventParams: [
          buildApiGatewayEvent({ path: `/${MODULE_NAME}${path}`, httpMethod: 'POST', headers: { Origin: 'https://sign.example.com' } }),
          context,
        ],
        qpqEventRecordResponses: [record],
      });

    const [matched] = await fromSigningSite('/signer/session');
    const [unmatched] = await fromSigningSite('/elsewhere');

    expect((matched as any).headers['Access-Control-Allow-Origin']).toBe('https://sign.example.com');
    expect((unmatched as any).headers['Access-Control-Allow-Origin']).not.toBe('https://sign.example.com');
  });

  it('rejects a non-string body with a generic error response', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: { not: 'a string' }, headers: {} } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(500);
    expect(JSON.parse((response as any).body).errorText).toBe('Response body must be a string');
  });
});
