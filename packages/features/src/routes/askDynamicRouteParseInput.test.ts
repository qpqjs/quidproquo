import { ErrorTypeEnum, runStory, StoryError } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';

import { askDynamicRouteParseInput } from './askDynamicRouteParseInput';

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

const bodySchema = z.object({ name: z.string().min(1) });
const querySchema = z.object({ limit: z.coerce.number().default(10) });

describe('askDynamicRouteParseInput', () => {
  it('returns undefined body and query when no schema is declared', () => {
    expect(runStory(askDynamicRouteParseInput(buildEvent({ body: '{"name":"x"}' })))).toEqual({ body: undefined, query: undefined });
  });

  it('parses a json body against the body schema', () => {
    const input = runStory(askDynamicRouteParseInput(buildEvent({ body: '{"name":"x"}' }), { body: bodySchema }));

    expect(input).toEqual({ body: { name: 'x' }, query: undefined });
  });

  it('decodes a base64 body before parsing', () => {
    const body = Buffer.from('{"name":"x"}').toString('base64');
    const input = runStory(askDynamicRouteParseInput(buildEvent({ body, isBase64Encoded: true }), { body: bodySchema }));

    expect(input.body).toEqual({ name: 'x' });
  });

  it('applies query coercion and defaults', () => {
    const input = runStory(askDynamicRouteParseInput(buildEvent({ query: { limit: '5' } }), { query: querySchema }));
    expect(input.query).toEqual({ limit: 5 });

    const defaulted = runStory(askDynamicRouteParseInput(buildEvent(), { query: querySchema }));
    expect(defaulted.query).toEqual({ limit: 10 });
  });

  // Security regression: the handler sees only what the schema declares, and a 422 names the path and expectation
  // without echoing the submitted value.
  it('drops undeclared body fields so a client cannot smuggle extra properties to the handler', () => {
    const input = runStory(askDynamicRouteParseInput(buildEvent({ body: '{"name":"x","isAdmin":true,"__proto__":{"a":1}}' }), { body: bodySchema }));

    expect(input.body).toEqual({ name: 'x' });
    expect(Object.keys(input.body as object)).toEqual(['name']);
  });

  it('never echoes a rejected value in the 422 message', () => {
    const schema = z.object({ count: z.number() });
    const run = () => runStory(askDynamicRouteParseInput(buildEvent({ body: '{"count":"leaked-secret-value-123"}' }), { body: schema }));

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
      expect((error as StoryError).errorText).not.toContain('leaked-secret-value-123');
    }
  });

  it('throws BadRequest on malformed json', () => {
    const run = () => runStory(askDynamicRouteParseInput(buildEvent({ body: '{nope' }), { body: bodySchema }));

    expect(run).toThrow(StoryError);
    expect(run).toThrow(/Invalid JSON request body/);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.BadRequest);
    }
  });

  it('throws Invalid when the body does not match the schema', () => {
    const run = () => runStory(askDynamicRouteParseInput(buildEvent({ body: '{"name":""}' }), { body: bodySchema }));

    expect(run).toThrow(/Invalid request body/);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
    }
  });

  it('treats a missing body as undefined and lets the schema decide', () => {
    const run = () => runStory(askDynamicRouteParseInput(buildEvent(), { body: bodySchema }));

    expect(run).toThrow(/Invalid request body/);
  });
});
