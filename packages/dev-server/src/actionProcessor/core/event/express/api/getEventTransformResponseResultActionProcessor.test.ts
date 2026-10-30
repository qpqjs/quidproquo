import { ErrorTypeEnum, EventActionType, resolveActionResult } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';
import { defineRoute } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const invoke = async (qpqEventRecordResponses: any) => {
  const processors = await getEventTransformResponseResultActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  const process = processors[EventActionType.TransformResponseResult];
  return invokeProcessor(process!, { eventParams: [{ headers: {} }], qpqEventRecordResponses } as any);
};

describe('getEventTransformResponseResultActionProcessor (express)', () => {
  it('maps a success record onto the express response, merging CORS headers', async () => {
    const result = await invoke([{ success: true, result: { status: 201, body: 'created', isBase64Encoded: false, headers: { 'x-custom': 'y' } } }]);

    const output = resolveActionResult(result);
    expect(output.statusCode).toBe(201);
    expect(output.body).toBe('created');
    expect(output.isBase64Encoded).toBe(false);
    expect(output.headers['x-custom']).toBe('y');
    expect(output.headers['Access-Control-Allow-Origin']).toBeDefined();
  });

  it("answers with the matched route's own allowed origin, as its preflight does", async () => {
    const config = buildTestQpqConfig([
      defineRoute('POST', '/signer/session', '/entry/handler::handler', { allowedOrigins: ['http://localhost:3082'] }),
    ]);
    const processors = await getEventTransformResponseResultActionProcessor(config, noopDynamicModuleLoader);
    const fromSigningSite = async (path: string) =>
      resolveActionResult(
        await invokeProcessor(processors![EventActionType.TransformResponseResult]!, {
          eventParams: [{ path, method: 'POST', headers: { origin: 'http://localhost:3082' } }],
          qpqEventRecordResponses: [{ success: true, result: { status: 200, body: 'ok', isBase64Encoded: false } }],
        } as any),
      );

    expect((await fromSigningSite('/signer/session')).headers['Access-Control-Allow-Origin']).toBe('http://localhost:3082');
    expect((await fromSigningSite('/elsewhere')).headers['Access-Control-Allow-Origin']).not.toBe('http://localhost:3082');
  });

  it('defaults an empty body when the success record has none', async () => {
    const result = await invoke([{ success: true, result: { status: 200, isBase64Encoded: false } }]);

    expect(resolveActionResult(result).body).toBe('');
  });

  // Security regression: the stack stays in the log; a caller only ever sees the error type and text.
  it('never sends an error stack or stack frames to the caller', async () => {
    const error = {
      errorType: ErrorTypeEnum.GenericError,
      errorText: 'An unexpected error occurred [TypeError].',
      errorStack: 'TypeError: x\n    at handler (/app/index.js:1:1)',
    };
    const output = resolveActionResult(await invoke([{ success: false, error }]));

    expect(output.statusCode).toBe(500);
    expect(Object.keys(JSON.parse(output.body)).sort()).toEqual(['errorText', 'errorType']);
    expect(output.body).not.toMatch(/\n\s+at /);
  });

  it('maps a NotFound error record to a 404 response', async () => {
    const result = await invoke([{ success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'nope' } }]);

    const output = resolveActionResult(result);
    expect(output.statusCode).toBe(404);
    expect(output.body).toContain(ErrorTypeEnum.NotFound);
  });

  it('maps an Unauthorized error record to a 401 response', async () => {
    const result = await invoke([{ success: false, error: { errorType: ErrorTypeEnum.Unauthorized, errorText: 'no' } }]);

    expect(resolveActionResult(result).statusCode).toBe(401);
  });

  it('maps an unknown error type to a 500 response', async () => {
    const result = await invoke([{ success: false, error: { errorType: 'SomethingElse', errorText: 'boom' } }]);

    expect(resolveActionResult(result).statusCode).toBe(500);
  });
});
