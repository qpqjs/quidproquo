import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askWebsocketConnectionInfoProvide } from './askWebsocketConnectionInfoProvide';
import { askWebsocketConnectionInfoRead } from './askWebsocketConnectionInfoRead';

describe('askWebsocketConnectionInfoRead', () => {
  it('reads the connection info from context', () => {
    const info = { apiName: 'api', connectionId: 'c1' };

    expect(runStory(askWebsocketConnectionInfoRead(), { [ContextActionType.Read]: info })).toEqual(info);
  });

  it('round-trips a provided connection info', () => {
    const info = { apiName: 'api', connectionId: 'c1' };

    expect(runStory(askWebsocketConnectionInfoProvide(info, askWebsocketConnectionInfoRead()))).toEqual(info);
  });
});
