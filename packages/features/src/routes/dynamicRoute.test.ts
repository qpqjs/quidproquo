import { AskResponse, askThrowError, ErrorTypeEnum, runStory, StoryError } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';

import { dynamicRoute } from './dynamicRoute';

const buildEvent = (overrides: Partial<HTTPEvent> = {}): HTTPEvent => ({
  path: '/widgets',
  query: {},
  headers: {},
  method: 'POST',
  correlation: 'c',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
  ...overrides,
});

// Compile-time only: fails to type check unless A and B are exactly the same type
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assertType = <A, B>(_value: A, _same: Equals<A, B>) => {};

const echo = function* (_event: HTTPEvent, _params: Record<string, string>, input: unknown): AskResponse<HTTPEventResponse> {
  return qpqWebServerUtils.toJsonEventResponse(input);
};

describe('dynamicRoute', () => {
  it('publishes the zod schema as json schema on the route options', () => {
    const route = dynamicRoute(['POST', '/widgets'], echo, {
      schema: { summary: 'Create', body: z.object({ name: z.string() }) },
    });

    expect(route.dynamicRoute).toMatchObject({ method: 'POST', path: '/widgets', version: 1 });
    expect(route.dynamicRoute.options?.schema).toMatchObject({
      summary: 'Create',
      bodyJsonSchema: { type: 'object', required: ['name'] },
    });
  });

  it('layers the zod schema over a plain schema given in the settings tuple', () => {
    const route = dynamicRoute(['POST', '/widgets', 2, { schema: { tags: ['widgets'], summary: 'old' } }], echo, {
      schema: { summary: 'new' },
    });

    expect(route.dynamicRoute.options?.schema).toEqual({ tags: ['widgets'], summary: 'new' });
  });

  it('leaves options untouched when no zod schema is given', () => {
    const options = { schema: { tags: ['widgets'] } };
    const route = dynamicRoute(['GET', '/widgets', 1, options], echo);

    expect(route.dynamicRoute.options).toBe(options);
  });

  it('hands the parsed body to the handler', () => {
    const route = dynamicRoute(['POST', '/widgets'], echo, { schema: { body: z.object({ name: z.string() }) } });

    const response = runStory(route(buildEvent({ body: '{"name":"x"}' }), {}));

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body ?? '')).toEqual({ body: { name: 'x' } });
  });

  it('turns a schema failure into a 422', () => {
    const route = dynamicRoute(['POST', '/widgets'], echo, { schema: { body: z.object({ name: z.string() }) } });

    const response = runStory(route(buildEvent({ body: '{"name":1}' }), {}));

    expect(response.status).toBe(422);
    expect(JSON.parse(response.body ?? '')).toMatchObject({ error: ErrorTypeEnum.GenericError });
  });

  it('maps known errors to their status and lets unknown ones escape', () => {
    const failWith = (errorType: ErrorTypeEnum) =>
      dynamicRoute(
        ['GET', '/widgets'],
        function* (): AskResponse<HTTPEventResponse> {
          return yield* askThrowError(errorType, 'boom');
        },
        { knownErrors: { [ErrorTypeEnum.NotFound]: { code: 404, message: 'no widget' } } },
      );

    const notFound = runStory(failWith(ErrorTypeEnum.NotFound)(buildEvent(), {}));
    expect(notFound.status).toBe(404);
    expect(JSON.parse(notFound.body ?? '')).toMatchObject({ errorText: 'no widget' });

    expect(() => runStory(failWith(ErrorTypeEnum.Unauthorized)(buildEvent(), {}))).toThrow(StoryError);
  });

  it('infers the handler input types from the schema', () => {
    dynamicRoute(
      ['POST', '/widgets/{id}'],
      function* (_event, params, input): AskResponse<HTTPEventResponse> {
        assertType<typeof params, { id: string }>(params, true);
        assertType<typeof input.body, { name: string }>(input.body, true);
        assertType<typeof input.query, { limit: number }>(input.query, true);

        return qpqWebServerUtils.toJsonEventResponse(input);
      },
      {
        schema: {
          body: z.object({ name: z.string() }),
          query: z.object({ limit: z.coerce.number() }),
        },
      },
    );

    dynamicRoute(['GET', '/widgets'], function* (_event, _params, input): AskResponse<HTTPEventResponse> {
      assertType<typeof input.body, undefined>(input.body, true);

      return qpqWebServerUtils.toJsonEventResponse(input);
    });
  });
});
