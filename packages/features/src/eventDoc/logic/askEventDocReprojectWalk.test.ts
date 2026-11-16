import { KeyValueStoreActionType, QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocReprojectQueueName } from '../constants/eventDocReprojectQueueName';
import { EventDocReprojectMessageType, EventDocReprojectSource } from '../models';
import { askEventDocReprojectWalk } from './askEventDocReprojectWalk';

// A walk of any size is a run of short steps: each reads one page, queues a message per document, and queues the next
// step, so no invocation ever has to hold a whole store.

type SendPayload = { queueName: string; queueMessages: { type: string; payload: unknown }[] };

const walk = (items: unknown[], nextPageKey?: string) => {
  const sends: SendPayload[] = [];

  const queued = runStory(askEventDocReprojectWalk('envelopes', { source: EventDocReprojectSource.Lists }), {
    [KeyValueStoreActionType.ScanAllScopes]: { items, nextPageKey },
    [QueueActionType.SendMessage]: (action: { payload: SendPayload }) => {
      sends.push(action.payload);
      return undefined;
    },
  });

  return { queued, sends };
};

const ROWS = [
  { scope: 'TENANT#a', item: { pk: 'summary#envelope', id: 'doc-1' } },
  { scope: 'TENANT#b', item: { pk: 'summary#envelope', id: 'doc-2' } },
];

describe('askEventDocReprojectWalk', () => {
  it("queues one reproject message per document on the collection's own queue", () => {
    const { queued, sends } = walk(ROWS);

    expect(queued).toBe(2);
    expect(sends).toEqual([
      {
        queueName: eventDocReprojectQueueName('envelopes'),
        queueMessages: [
          { type: EventDocReprojectMessageType.Document, payload: { type: 'envelope', docId: 'doc-1', scope: 'TENANT#a' } },
          { type: EventDocReprojectMessageType.Document, payload: { type: 'envelope', docId: 'doc-2', scope: 'TENANT#b' } },
        ],
      },
    ]);
  });

  it('queues the next step with the page cursor while there is more to read, keeping the source', () => {
    const { sends } = walk(ROWS, 'page-2');

    expect(sends[1]).toEqual({
      queueName: eventDocReprojectQueueName('envelopes'),
      queueMessages: [{ type: EventDocReprojectMessageType.Walk, payload: { source: EventDocReprojectSource.Lists, nextPageKey: 'page-2' } }],
    });
  });

  it('keeps walking past a page that held no documents, and sends nothing for an empty last page', () => {
    expect(walk([{ item: { pk: 'overview#envelope', id: 'doc-1' } }], 'page-2').sends.map((send) => send.queueMessages[0]?.type)).toEqual([
      EventDocReprojectMessageType.Walk,
    ]);
    expect(walk([]).sends).toEqual([]);
  });
});
