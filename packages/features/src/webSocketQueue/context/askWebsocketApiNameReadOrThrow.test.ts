import { ContextActionType, ErrorTypeEnum } from '@qpqjs/core';
import { runStory, StoryError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askWebsocketApiNameReadOrThrow } from './askWebsocketApiNameReadOrThrow';

describe('askWebsocketApiNameReadOrThrow', () => {
  it('returns the api name when present', () => {
    expect(runStory(askWebsocketApiNameReadOrThrow(), { [ContextActionType.Read]: { apiName: 'api' } })).toBe('api');
  });

  it('throws NotFound when the api name is missing', () => {
    let thrown: unknown;
    try {
      runStory(askWebsocketApiNameReadOrThrow(), { [ContextActionType.Read]: {} });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(StoryError);
    expect((thrown as StoryError).errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
