import { ErrorTypeEnum, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { HTTPEvent } from '../types/HTTPEvent';
import {
  askFromJsonEventRequest,
  askFromValidJsonEventRequest,
  fromJsonEventRequest,
  rawFromJsonEventRequest,
  readUriQueryParamFromEvent,
  toCdnResponse,
  toHtmlResponse,
  toJsonEventResponse,
  toMovedPermanentlyRedirectResponse,
  toMovedTemporarilyRedirectResponse,
  toTextResponse,
} from './httpEventUtils';

const buildEvent = (overrides: Partial<HTTPEvent>): HTTPEvent => ({ headers: {}, isBase64Encoded: false, ...overrides }) as HTTPEvent;

describe('rawFromJsonEventRequest', () => {
  it('returns the plain body when not base64 encoded', () => {
    expect(rawFromJsonEventRequest(buildEvent({ body: '{"a":1}' }))).toBe('{"a":1}');
  });

  it('decodes a base64 encoded body', () => {
    const body = Buffer.from('{"a":1}').toString('base64');
    expect(rawFromJsonEventRequest(buildEvent({ body, isBase64Encoded: true }))).toBe('{"a":1}');
  });
});

describe('fromJsonEventRequest', () => {
  it('parses the JSON body', () => {
    expect(fromJsonEventRequest(buildEvent({ body: '{"a":1}' }))).toEqual({ a: 1 });
  });

  it('throws when the body is missing', () => {
    expect(() => fromJsonEventRequest(buildEvent({}))).toThrow('Unable to parse undefined json body from event.');
  });

  it('throws when the body is not valid JSON', () => {
    expect(() => fromJsonEventRequest(buildEvent({ body: 'nope' }))).toThrow('Unable to parse incoming json body from event.');
  });
});

describe('askFromJsonEventRequest', () => {
  it('returns the parsed body', () => {
    expect(runStory(askFromJsonEventRequest(buildEvent({ body: '{"a":1}' })))).toEqual({ a: 1 });
  });

  it('throws a BadRequest when the body is missing', () => {
    expect(() => runStory(askFromJsonEventRequest(buildEvent({})))).toThrow(StoryError);
    try {
      runStory(askFromJsonEventRequest(buildEvent({})));
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.BadRequest);
    }
  });

  it('throws a BadRequest when the body is not valid JSON', () => {
    try {
      runStory(askFromJsonEventRequest(buildEvent({ body: 'nope' })));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.BadRequest);
    }
  });
});

describe('askFromValidJsonEventRequest', () => {
  const validateUser = (data: unknown): { name: string } => {
    const user = data as { name?: unknown };
    if (typeof user?.name !== 'string') {
      throw new Error('name must be a string');
    }
    return { name: user.name };
  };

  it('returns the validated body', () => {
    expect(runStory(askFromValidJsonEventRequest(buildEvent({ body: '{"name":"joe"}' }), validateUser))).toEqual({ name: 'joe' });
  });

  it('throws an Invalid error carrying the validator message when validation fails', () => {
    try {
      runStory(askFromValidJsonEventRequest(buildEvent({ body: '{"name":7}' }), validateUser));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
      expect((e as StoryError).errorText).toBe('name must be a string');
    }
  });

  it('still throws a BadRequest for an unparseable body (before validation runs)', () => {
    try {
      runStory(askFromValidJsonEventRequest(buildEvent({ body: 'nope' }), validateUser));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.BadRequest);
    }
  });
});

describe('readUriQueryParamFromEvent', () => {
  it('returns a single string value', () => {
    expect(readUriQueryParamFromEvent(buildEvent({ query: { limit: '10' } }), 'limit')).toBe('10');
  });

  it('returns the first value of a multi-value param', () => {
    expect(readUriQueryParamFromEvent(buildEvent({ query: { tag: ['a', 'b'] } }), 'tag')).toBe('a');
  });

  it('returns undefined for a missing param', () => {
    expect(readUriQueryParamFromEvent(buildEvent({ query: {} }), 'limit')).toBeUndefined();
  });

  it('returns undefined for an empty value', () => {
    expect(readUriQueryParamFromEvent(buildEvent({ query: { limit: '' } }), 'limit')).toBeUndefined();
  });
});

describe('http event responses', () => {
  it('builds a JSON response defaulting to status 200', () => {
    expect(toJsonEventResponse({ a: 1 })).toEqual({
      status: 200,
      body: '{"a":1}',
      isBase64Encoded: false,
      headers: { 'content-type': 'application/json' },
    });
  });

  it('builds an HTML response with a custom status', () => {
    expect(toHtmlResponse('<p>hi</p>', 201)).toEqual({
      status: 201,
      body: '<p>hi</p>',
      isBase64Encoded: false,
      headers: { 'content-type': 'text/html' },
    });
  });

  it('builds a plain text response', () => {
    expect(toTextResponse('hi')).toMatchObject({ body: 'hi', headers: { 'content-type': 'text/plain' } });
  });

  it('builds a permanent redirect', () => {
    expect(toMovedPermanentlyRedirectResponse('/new')).toEqual({
      status: 301,
      isBase64Encoded: false,
      headers: { Location: '/new' },
    });
  });

  it('builds a temporary redirect', () => {
    expect(toMovedTemporarilyRedirectResponse('/new')).toEqual({
      status: 302,
      isBase64Encoded: false,
      headers: { Location: '/new' },
    });
  });

  it('builds a CDN fallback response', () => {
    expect(toCdnResponse()).toEqual({ status: 200, fallbackToCDN: true });
  });
});
