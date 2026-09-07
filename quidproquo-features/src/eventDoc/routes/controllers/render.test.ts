import {
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  QpqIsoDateTime,
  runStory,
  throwsError,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { eventDocFunctionsName } from '../../constants/eventDocFunctionsName';
import { buildEventDocStore } from '../../context/buildEventDocStore';
import { buildEventDocStoreGlobals } from '../../globals/buildEventDocStoreGlobals';
import { EventDocEvent, EventDocRenderInput, EventDocRenderKind, EventDocRenderMode, EventDocSummary, EventDocVersion } from '../../models';
import { EventDocStoredEvent } from '../../types/EventDocStoredEvent';
import { render } from './render';

// The route — not the renderer — is what applies renderMode/effectiveAt. It hands the
// collection's registered render function an already-resolved log plus the version behind it,
// because a renderer cannot derive the publish moment from events alone (it needs
// version.publishedAt to resolve ITS links as of then). These pin that contract: the params are
// honoured here, and a published request never silently degrades to draft content.

const DOC_ID = 'doc-1';
const REQUEST_NOW = '2026-07-15T00:00:00.000Z';

const store = buildEventDocStore({ storeName: 'templates', type: 'template' });
const FUNCTIONS_NAME = eventDocFunctionsName('templates', 'template');

const eventId = (n: number): number => n;

const buildEvent = (index: number): EventDocEvent => ({
  type: 'SET_BODY',
  payload: {
    data: { body: `body-${index}` },
    metadata: {
      version: 1,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'user-1' } as EventDocEvent['payload']['metadata']['createdBy'],
      createdAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
      eventId: eventId(index),
    },
  },
});

const EVENTS: EventDocEvent[] = [0, 1, 2, 3].map(buildEvent);

const storedEvents: EventDocStoredEvent[] = EVENTS.map((event) => ({
  pk: DOC_ID,
  sk: event.payload.metadata.eventId,
  type: 'template',
  data: event,
}));

// v1 published 03-01 with head @1 — so a published render must cut events 2 and 3.
const VERSION_1: EventDocVersion = {
  version: 1,
  eventId: eventId(1),
  publishedAt: '2026-03-01T00:00:00.000Z' as QpqIsoDateTime,
  effectiveFrom: '2026-03-01T00:00:00.000Z' as QpqIsoDateTime,
};
const VERSION_DRAFT: EventDocVersion = { version: 2, eventId: eventId(3) };

const buildSummary = (versions: EventDocVersion[]): EventDocSummary => ({
  type: 'template',
  id: DOC_ID,
  code: 'tpl-1',
  name: 'Template One',
  createdAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
  updatedAt: '2026-01-01T00:00:00.000Z' as QpqIsoDateTime,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  versions,
});

const httpEvent = (query: Record<string, string>): HTTPEvent => ({
  path: `/templates/${DOC_ID}/render`,
  query,
  body: '',
  headers: {},
  method: 'GET',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

type ExecutePayload = { dynamicFunctionsName: string; functionName: string; args: [EventDocRenderInput] | [EventDocEvent[], unknown?] };

// The sort-key bound the state resolver issues (upToEventId → at-or-before), honoured
// for real so a published render's truncation at the version's head is exercised.
const skAtOrBefore = (keyCondition: KvsQueryOperation): number | undefined => {
  if ('conditions' in keyCondition) {
    return (keyCondition as KvsLogicalOperator).conditions.map(skAtOrBefore).find((v) => v !== undefined);
  }

  const condition = keyCondition as KvsQueryCondition;
  return condition.key === 'sk' && condition.operation === KvsQueryOperationType.LessThanOrEqual ? Number(condition.valueA) : undefined;
};

// Captures what the route hands the renderer — the thing under test. The registered
// fold echoes the event ids it was handed (no snapshots exist, so the resolver folds
// the prefix from scratch), so `state` in the render input identifies the exact prefix.
const renderWith = (query: Record<string, string>, versions: EventDocVersion[] = [VERSION_1, VERSION_DRAFT]) => {
  const globals = buildEventDocStoreGlobals(store);
  const renderInputs: EventDocRenderInput[] = [];

  const response = runStory(render(httpEvent(query), { id: DOC_ID }), {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => {
      if (!(action.payload.globalName in globals)) {
        throw new Error(`Global config ${action.payload.globalName} not found`);
      }
      return globals[action.payload.globalName];
    },
    [DateActionType.Now]: () => REQUEST_NOW,
    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      if (action.payload.keyValueStoreName === store.snapshotsStoreName) {
        return { items: [], nextPageKey: undefined };
      }
      if (action.payload.keyValueStoreName === store.eventsStoreName) {
        const upTo = skAtOrBefore(action.payload.keyCondition);
        const matching = storedEvents.filter((row) => upTo === undefined || row.sk <= upTo);
        const ascending = action.payload.options?.sortAscending !== false;
        const sorted = [...matching].sort((a, b) => (a.sk - b.sk) * (ascending ? 1 : -1));
        return { items: sorted.slice(0, action.payload.options?.limit), nextPageKey: undefined };
      }
      return { items: [buildSummary(versions)], nextPageKey: undefined };
    },
    [DynamicFunctionsActionType.Execute]: (action: { payload: ExecutePayload }) => {
      expect(action.payload.dynamicFunctionsName).toBe(FUNCTIONS_NAME);

      if (action.payload.functionName === 'foldDocumentState') {
        const [events] = action.payload.args as [EventDocEvent[]];
        return { foldedEventIds: events.map((event) => event.payload.metadata.eventId) };
      }

      expect(action.payload.functionName).toBe('render');
      renderInputs.push(action.payload.args[0] as EventDocRenderInput);
      return { kind: EventDocRenderKind.Html, html: '<p>rendered</p>' };
    },
  });

  return { response, renderInput: renderInputs[0] };
};

describe('render route', () => {
  it('hands the renderer the state at the head and no version for a draft render', () => {
    const { renderInput } = renderWith({ renderMode: EventDocRenderMode.Draft });

    expect(renderInput.state).toEqual({ foldedEventIds: [eventId(0), eventId(1), eventId(2), eventId(3)] });
    expect(renderInput.version).toBeUndefined();
  });

  it('defaults to the head state when no mode is given', () => {
    const { renderInput } = renderWith({});

    expect(renderInput.state).toEqual({ foldedEventIds: [eventId(0), eventId(1), eventId(2), eventId(3)] });
    expect(renderInput.version).toBeUndefined();
  });

  it('hands the renderer the state at the version head and the version itself for a published render', () => {
    const { renderInput } = renderWith({ renderMode: EventDocRenderMode.Published });

    // Folded from the prefix truncated at v1's head — the draft edits (2, 3) must not
    // reach a published render.
    expect(renderInput.state).toEqual({ foldedEventIds: [eventId(0), eventId(1)] });
    // The version is what carries publishedAt, the clock the renderer resolves its links at.
    expect(renderInput.version).toEqual(VERSION_1);
  });

  it('resolves the published version as of an explicit effectiveAt, not the request time', () => {
    // v1 only takes effect 03-01, so as of 02-01 nothing is published — which can only be true if
    // effectiveAt drove the selection rather than the request clock (07-15, where v1 IS effective).
    expect(() => renderWith({ renderMode: EventDocRenderMode.Published, effectiveAt: '2026-02-01T00:00:00.000Z' })).toThrow(
      'No published version is effective as of 2026-02-01T00:00:00.000Z',
    );
  });

  it('fails rather than falling back to the draft when nothing is published', () => {
    expect(() => renderWith({ renderMode: EventDocRenderMode.Published }, [VERSION_DRAFT])).toThrow('No published version is effective as of');
  });

  it('404s as "no renderer configured" when the collection has no registered functions object', () => {
    const globals = buildEventDocStoreGlobals(store);

    const renderMissing = () =>
      runStory(render(httpEvent({}), { id: DOC_ID }), {
        [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName],
        [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string } }) =>
          action.payload.keyValueStoreName === store.eventsStoreName
            ? { items: storedEvents, nextPageKey: undefined }
            : { items: [], nextPageKey: undefined },
        [DynamicFunctionsActionType.Execute]: throwsError(
          DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound,
          `Dynamic functions not found: [${FUNCTIONS_NAME}]`,
        ),
      });

    expect(renderMissing).toThrow('This collection has no renderer configured.');
  });

  it('propagates a configured renderer failure as-is, never as a 404', () => {
    const globals = buildEventDocStoreGlobals(store);

    const renderFailing = () =>
      runStory(render(httpEvent({}), { id: DOC_ID }), {
        [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName],
        [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string } }) =>
          action.payload.keyValueStoreName === store.eventsStoreName
            ? { items: storedEvents, nextPageKey: undefined }
            : { items: [], nextPageKey: undefined },
        [DynamicFunctionsActionType.Execute]: throwsError(
          DynamicFunctionsExecuteErrorTypeEnum.ModuleLoadFailed,
          `Unable to dynamically load dynamic functions: [${FUNCTIONS_NAME}]`,
        ),
      });

    expect(renderFailing).toThrow(`Unable to dynamically load dynamic functions: [${FUNCTIONS_NAME}]`);
  });
});
