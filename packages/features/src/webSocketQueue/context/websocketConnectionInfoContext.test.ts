import { ContextActionType, ErrorTypeEnum, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askWebsocketReadApiNameOrThrow, askWebsocketReadConnectionInfo, websocketConnectionInfoContext } from './websocketConnectionInfoContext';

describe('websocketConnectionInfoContext', () => {
  it('defaults to an empty connection info', () => {
    expect(websocketConnectionInfoContext.defaultValue).toEqual({});
  });
});

describe('askWebsocketReadConnectionInfo', () => {
  it('reads the connection info from context', () => {
    const info = { apiName: 'api', connectionId: 'c1' };
    expect(runStory(askWebsocketReadConnectionInfo(), { [ContextActionType.Read]: info })).toEqual(info);
  });
});

describe('askWebsocketReadApiNameOrThrow', () => {
  it('returns the api name when present', () => {
    expect(runStory(askWebsocketReadApiNameOrThrow(), { [ContextActionType.Read]: { apiName: 'api' } })).toBe('api');
  });

  it('throws NotFound when the api name is missing', () => {
    try {
      runStory(askWebsocketReadApiNameOrThrow(), { [ContextActionType.Read]: {} });
      throw new Error('expected a StoryError');
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.NotFound);
    }
  });
});
