import { ConfigActionType, QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askSeedProcessDeployCreate } from './askSeedProcessDeployCreate';

describe('askSeedProcessDeployCreate', () => {
  it('queues a run message for every seed', () => {
    const messages: any[] = [];

    runStory(askSeedProcessDeployCreate(), {
      [ConfigActionType.GetGlobal]: ['seed/a::run', 'seed/b::run'],
      [QueueActionType.SendMessage]: (action: any) => {
        messages.push(action.payload);
        return undefined;
      },
    });

    expect(messages).toEqual([
      { queueName: 'qpqSeeds', queueMessages: [{ type: 'seed/a::run', payload: undefined }] },
      { queueName: 'qpqSeeds', queueMessages: [{ type: 'seed/b::run', payload: undefined }] },
    ]);
  });
});
