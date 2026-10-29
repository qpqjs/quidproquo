import { ConfigActionType, DeployEvent, DeployEventStatusType, DeployEventType, QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { onDeploy } from './onDeploy';

describe('seed deployEvent onDeploy', () => {
  it('delegates the deploy event to the seed logic', () => {
    const event: DeployEvent = { deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Create };

    const messages: any[] = [];

    runStory(onDeploy(event), {
      [ConfigActionType.GetGlobal]: ['seed/a::run'],
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload);
        return undefined;
      },
    });

    expect(messages).toEqual([{ queueName: 'qpqSeeds', queueMessages: [{ type: 'seed/a::run', payload: undefined }] }]);
  });

  it("ignores a create event from a stack that is not this service's api", () => {
    const event: DeployEvent = { deployEventType: DeployEventType.Unknown, deployEventStatusType: DeployEventStatusType.Create };

    const messages: any[] = [];

    runStory(onDeploy(event), {
      [ConfigActionType.GetGlobal]: ['seed/a::run'],
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload);
        return undefined;
      },
    });

    expect(messages).toEqual([]);
  });
});
