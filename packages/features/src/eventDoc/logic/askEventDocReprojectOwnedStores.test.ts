import { QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocActionType } from '../actions/EventDocActionType';
import { eventDocReprojectQueueName } from '../constants/eventDocReprojectQueueName';
import { EventDocReprojectMessageType, EventDocReprojectSource } from '../models';
import { askEventDocReprojectOwnedStores } from './askEventDocReprojectOwnedStores';

type SendPayload = { queueName: string; queueMessages: { type: string; payload: unknown }[] };

const start = (source?: EventDocReprojectSource) => {
  const sends: SendPayload[] = [];

  const started = runStory(askEventDocReprojectOwnedStores(source), {
    [EventDocActionType.ReadOwnedStoreNames]: ['envelopes', 'packBuilds'],
    [QueueActionType.SendMessage]: (action: { payload: SendPayload }) => {
      sends.push(action.payload);
      return undefined;
    },
  });

  return { started, sends };
};

describe('askEventDocReprojectOwnedStores', () => {
  it('starts a walk of every collection the service owns, each on its own queue, from the lists store', () => {
    const { started, sends } = start();
    const walk = { type: EventDocReprojectMessageType.Walk, payload: { source: EventDocReprojectSource.Lists, nextPageKey: undefined } };

    expect(started).toEqual(['envelopes', 'packBuilds']);
    expect(sends).toEqual([
      { queueName: eventDocReprojectQueueName('envelopes'), queueMessages: [walk] },
      { queueName: eventDocReprojectQueueName('packBuilds'), queueMessages: [walk] },
    ]);
  });

  it('walks the legacy summary stores when asked, for collections whose documents have no list view rows yet', () => {
    const { sends } = start(EventDocReprojectSource.LegacySummary);

    expect(sends.every((send) => (send.queueMessages[0]?.payload as { source: string }).source === EventDocReprojectSource.LegacySummary)).toBe(true);
  });
});
