import { Action, runStory } from 'quidproquo-core';
import { ApiActionType, ApiRequestActionPayload } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { EventDocEvent, EventDocEventInput } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { askEventDocWorkspaceApiAppendEvent } from './askEventDocWorkspaceApiAppendEvent';
import { askEventDocWorkspaceApiFetchBootstrap } from './askEventDocWorkspaceApiFetchBootstrap';
import { askEventDocWorkspaceApiFetchEvents } from './askEventDocWorkspaceApiFetchEvents';

const eventId = (n: number): number => n;

const identity: EventDocWorkspaceDocumentIdentity = { serviceName: 'notes', basePath: '/notes', id: 'doc-1' };

const storedEvent = (index: number): EventDocEvent => ({
  type: 'NOTE_SET_TITLE',
  payload: {
    data: { title: `title-${index}` },
    metadata: {
      version: 1,
      clientMessageId: `m-${index}`,
      createdBy: { userId: 'server', userDisplayName: 'Server' },
      createdAt: '2026-07-17T00:00:00.000Z',
      eventId: eventId(index),
    },
  },
});

describe('eventDocWorkspaceApiTransport', () => {
  it('fetches the full log across pages via the feature events route', () => {
    const requests: ApiRequestActionPayload<unknown>[] = [];

    // Two pages: the first returns a nextPageKey, the second closes the loop.
    const respondWithPage = (action: Action<ApiRequestActionPayload<unknown>>) => {
      requests.push(action.payload!);
      const isFirstPage = action.payload!.params?.nextPageKey === undefined;

      return isFirstPage
        ? { status: 200, data: { items: [storedEvent(0), storedEvent(1)], nextPageKey: 'page-2' } }
        : { status: 200, data: { items: [storedEvent(2)] } };
    };

    const events = runStory(askEventDocWorkspaceApiFetchEvents(identity), {
      [ApiActionType.Request]: respondWithPage,
    });

    expect(events.map((event) => event.payload.metadata.eventId)).toEqual([eventId(0), eventId(1), eventId(2)]);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ service: 'notes', method: 'GET', endpoint: '/v1/notes/doc-1/events' });
    expect(requests[1].params).toMatchObject({ nextPageKey: 'page-2' });
  });

  it('passes afterEventId through for incremental tail pulls', () => {
    const requests: ApiRequestActionPayload<unknown>[] = [];

    const respondEmpty = (action: Action<ApiRequestActionPayload<unknown>>) => {
      requests.push(action.payload!);
      return { status: 200, data: { items: [] } };
    };

    runStory(askEventDocWorkspaceApiFetchEvents(identity, eventId(7)), {
      [ApiActionType.Request]: respondEmpty,
    });

    // The cursor is a number in the transport and a string on the wire.
    expect(requests[0].params).toMatchObject({ afterEventId: String(eventId(7)) });
  });

  it('bootstrap asks for the base on the first page only, then pages the tail pinned to it', () => {
    const requests: ApiRequestActionPayload<unknown>[] = [];
    const base = { eventId: eventId(3), state: { title: 'snapped' } };

    // Two pages: the bootstrap page carries the base and a nextPageKey, the follow-up
    // is a plain events page pinned to the base's cursor.
    const respondWithPage = (action: Action<ApiRequestActionPayload<unknown>>) => {
      requests.push(action.payload!);
      const isFirstPage = action.payload!.params?.nextPageKey === undefined;

      return isFirstPage
        ? { status: 200, data: { base, items: [storedEvent(4)], nextPageKey: 'page-2' } }
        : { status: 200, data: { items: [storedEvent(5)] } };
    };

    const bootstrap = runStory(askEventDocWorkspaceApiFetchBootstrap(identity), {
      [ApiActionType.Request]: respondWithPage,
    });

    expect(bootstrap.base).toEqual(base);
    expect(bootstrap.events.map((event) => event.payload.metadata.eventId)).toEqual([eventId(4), eventId(5)]);

    expect(requests[0]).toMatchObject({ service: 'notes', method: 'GET', endpoint: '/v1/notes/doc-1/events', params: { includeBase: 'true' } });
    expect(requests[1].params).toMatchObject({ nextPageKey: 'page-2', afterEventId: String(eventId(3)) });
    expect(requests[1].params?.includeBase).toBeUndefined();
  });

  it('bootstrap passes a null base through with the full log', () => {
    const respondWithFallback = () => ({ status: 200, data: { base: null, items: [storedEvent(0), storedEvent(1)] } });

    const bootstrap = runStory(askEventDocWorkspaceApiFetchBootstrap(identity), {
      [ApiActionType.Request]: respondWithFallback,
    });

    expect(bootstrap.base).toBeNull();
    expect(bootstrap.events).toHaveLength(2);
  });

  it('POSTs an append and returns the stored event', () => {
    const input: EventDocEventInput = {
      type: 'NOTE_SET_TITLE',
      payload: { data: { title: 'hello' }, metadata: { version: 1, clientMessageId: 'm-9' } },
    };

    const requests: ApiRequestActionPayload<unknown>[] = [];

    const respondWithStored = (action: Action<ApiRequestActionPayload<unknown>>) => {
      requests.push(action.payload!);
      return { status: 200, data: storedEvent(3) };
    };

    const stored = runStory(askEventDocWorkspaceApiAppendEvent(identity, input), {
      [ApiActionType.Request]: respondWithStored,
    });

    expect(requests[0]).toMatchObject({ service: 'notes', method: 'POST', endpoint: '/v1/notes/doc-1/events', body: input });
    expect(stored.payload.metadata.eventId).toBe(eventId(3));
  });

  it('throws on a non-2xx response', () => {
    const respondServerError = () => ({ status: 500, data: undefined });

    expect(() =>
      runStory(askEventDocWorkspaceApiFetchEvents(identity), {
        [ApiActionType.Request]: respondServerError,
      }),
    ).toThrow(/Failed to load events \(500\)/);
  });
});
