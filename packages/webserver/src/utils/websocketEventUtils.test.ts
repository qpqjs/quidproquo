import { ErrorTypeEnum, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { WebsocketEvent } from '../types';
import { askFromJsonWebsocketEventRequest, fromJsonWebsocketEventRequest } from './websocketEventUtils';

const buildEvent = (body?: string): WebsocketEvent<string> => ({ body }) as WebsocketEvent<string>;

describe('fromJsonWebsocketEventRequest', () => {
  it('parses the JSON body', () => {
    expect(fromJsonWebsocketEventRequest(buildEvent('{"a":1}'))).toEqual({ a: 1 });
  });

  it('throws when the body is missing', () => {
    expect(() => fromJsonWebsocketEventRequest(buildEvent())).toThrow('websocketJsonEvent.body is undefined');
  });

  it('throws a friendly error when the body is not valid JSON', () => {
    expect(() => fromJsonWebsocketEventRequest(buildEvent('nope'))).toThrow('Unable to parse incoming json body from websocket event.');
  });
});

describe('askFromJsonWebsocketEventRequest', () => {
  it('returns the parsed body', () => {
    expect(runStory(askFromJsonWebsocketEventRequest(buildEvent('{"a":1}')))).toEqual({ a: 1 });
  });

  it('throws an Invalid error when the body is missing', () => {
    try {
      runStory(askFromJsonWebsocketEventRequest(buildEvent()));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
    }
  });

  it('throws an Invalid story error (not a raw SyntaxError) when the body is not valid JSON', () => {
    try {
      runStory(askFromJsonWebsocketEventRequest(buildEvent('nope')));
      throw new Error('expected a StoryError');
    } catch (e) {
      expect(e).toBeInstanceOf(StoryError);
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.Invalid);
    }
  });
});
