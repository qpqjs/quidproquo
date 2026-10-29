import { ConfigActionType, DeployEventStatusType, DeployEventType, QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askSeedProcessDeploy } from './askSeedProcessDeploy';

describe('askSeedProcessDeploy', () => {
  it('runs the create path on a create status', () => {
    const messages: any[] = [];

    runStory(askSeedProcessDeploy(DeployEventType.Api, DeployEventStatusType.Create), {
      [ConfigActionType.GetGlobal]: ['seed/a::run'],
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload.queueName);
        return undefined;
      },
    });

    expect(messages).toEqual(['qpqSeeds']);
  });

  it('does nothing on other statuses', () => {
    expect(runStory(askSeedProcessDeploy(DeployEventType.Api, DeployEventStatusType.Update))).toBeUndefined();
  });

  // The deploy rule hears every stack in the account; a stranger's CREATE_COMPLETE must not re-seed this service.
  it("does nothing when the created stack is not one of this service's own", () => {
    const messages: any[] = [];

    runStory(askSeedProcessDeploy(DeployEventType.Unknown, DeployEventStatusType.Create), {
      [ConfigActionType.GetGlobal]: ['seed/a::run'],
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload.queueName);
        return undefined;
      },
    });

    expect(messages).toEqual([]);
  });

  it('does not re-seed when the web stack is created after the api stack', () => {
    const messages: any[] = [];

    runStory(askSeedProcessDeploy(DeployEventType.Web, DeployEventStatusType.Create), {
      [ConfigActionType.GetGlobal]: ['seed/a::run'],
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload.queueName);
        return undefined;
      },
    });

    expect(messages).toEqual([]);
  });
});
