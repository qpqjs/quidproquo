import { QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocActionType } from '../../../../eventDoc/actions/EventDocActionType';
import { eventDocReprojectQueueName } from '../../../../eventDoc/constants/eventDocReprojectQueueName';
import { EventDocReprojectMessageType, EventDocReprojectSource } from '../../../../eventDoc/models';
import { WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent } from '../../../log/logic/webSocket';
import { onEventDocReprojectRequest } from './onEventDocReprojectRequest';

type Send = { queueName: string; queueMessages: { type: string; payload: unknown }[] };

const request = (payload: unknown) => {
  const sends: Send[] = [];

  const handled = runStory(onEventDocReprojectRequest({ message: { payload } } as WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent), {
    [EventDocActionType.ReadOwnedStoreNames]: ['envelopes'],
    [QueueActionType.SendMessage]: (action: { payload: Send }) => {
      sends.push(action.payload);
      return undefined;
    },
  });

  return { handled, sends };
};

const walkFrom = (source: EventDocReprojectSource): Send[] => [
  {
    queueName: eventDocReprojectQueueName('envelopes'),
    queueMessages: [{ type: EventDocReprojectMessageType.Walk, payload: { source, nextPageKey: undefined } }],
  },
];

describe('onEventDocReprojectRequest', () => {
  it('starts a walk of every event doc collection this service owns, from the lists store', () => {
    const { handled, sends } = request({});

    expect(handled).toBe(true);
    expect(sends).toEqual(walkFrom(EventDocReprojectSource.Lists));
  });

  it('walks the legacy summary stores when the request asks for that source', () => {
    expect(request({ source: EventDocReprojectSource.LegacySummary }).sends).toEqual(walkFrom(EventDocReprojectSource.LegacySummary));
  });

  it('falls back to the lists store for a source it does not know', () => {
    expect(request({ source: 'somewhere-else' }).sends).toEqual(walkFrom(EventDocReprojectSource.Lists));
  });
});
