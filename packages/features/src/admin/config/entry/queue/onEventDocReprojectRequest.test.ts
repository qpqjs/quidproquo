import { QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocActionType } from '../../../../eventDoc/actions/EventDocActionType';
import { eventDocReprojectQueueName } from '../../../../eventDoc/constants/eventDocReprojectQueueName';
import { EventDocReprojectMessageType, EventDocReprojectSource } from '../../../../eventDoc/models';
import { WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent } from '../../../log/logic/webSocket';
import { onEventDocReprojectRequest } from './onEventDocReprojectRequest';

describe('onEventDocReprojectRequest', () => {
  it('starts a walk of every event doc collection this service owns', () => {
    const sends: { queueName: string; queueMessages: { type: string; payload: unknown }[] }[] = [];

    const handled = runStory(onEventDocReprojectRequest({} as WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent), {
      [EventDocActionType.ReadOwnedStoreNames]: ['envelopes'],
      [QueueActionType.SendMessage]: (action: { payload: (typeof sends)[number] }) => {
        sends.push(action.payload);
        return undefined;
      },
    });

    expect(handled).toBe(true);
    expect(sends).toEqual([
      {
        queueName: eventDocReprojectQueueName('envelopes'),
        queueMessages: [{ type: EventDocReprojectMessageType.Walk, payload: { source: EventDocReprojectSource.Lists, nextPageKey: undefined } }],
      },
    ]);
  });
});
