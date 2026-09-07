import { QpqReducer } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { createEventDocDefinition } from '../definition/createEventDocDefinition';
import { EventDocDocument, EventDocEffect, EventDocEvent, EventDocLink, EventDocLinkMode } from '../models';
import { createEventDocInitialDocumentState } from './createEventDocInitialDocumentState';
import { EventDocMigration } from './EventDocMigration';

const eventId = (n: number): number => n;

const SERVICE = 'template';
const STYLE_TYPE = 'style';

const LATEST_VERSION = 2;

// v1 called the field `styleList`; v2 renamed it to `styles`. The rename lives in the migration, and
// the collector is written against v2 only - that pairing is the whole point of these tests.
type StyleDocV1 = EventDocDocument & { styleList: EventDocLink[] };
type StyleDocV2 = EventDocDocument & { styles: EventDocLink[] };

const link = (id: string): EventDocLink => ({
  eventDocService: SERVICE,
  eventDocType: STYLE_TYPE,
  id,
  mode: EventDocLinkMode.Latest,
});

const event = (index: number, version: number, type: string, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'author-1', userDisplayName: 'Author One' },
      createdAt: `2026-07-27T00:00:0${index}.000Z`,
      eventId: eventId(index),
    },
  },
});

const initEvent = (version: number): EventDocEvent => event(0, version, EventDocEffect.InitState, { id: 'doc-1', code: 'doc', name: 'Doc' });

// One reducer per version, each seeing its own shape. The BASE version seeds — a v1 log folds onto a
// v1-shaped accumulator and only climbs to v2 through the migration, which is the whole arrangement
// these tests exist to pin.
const createInitialStyleDocV1 = (): StyleDocV1 => ({
  ...createEventDocInitialDocumentState(1),
  styleList: [],
});

const reducerV1: QpqReducer<StyleDocV1, EventDocEvent> = (state, incoming) => {
  if (incoming.type === EventDocEffect.InitState) {
    return [createInitialStyleDocV1(), true];
  }

  if (incoming.type === 'ADD_STYLE') {
    return [{ ...state, styleList: [...state.styleList, incoming.payload.data as EventDocLink] }, true];
  }

  if (incoming.type === 'REMOVE_STYLE') {
    return [{ ...state, styleList: state.styleList.filter((entry) => entry.id !== (incoming.payload.data as EventDocLink).id) }, true];
  }

  return [state, false];
};

const createInitialViewState = (): StyleDocV2 => ({
  ...createEventDocInitialDocumentState(LATEST_VERSION),
  styles: [],
});

const reducerV2: QpqReducer<StyleDocV2, EventDocEvent> = (state, incoming) => {
  if (incoming.type === EventDocEffect.InitState) {
    return [createInitialViewState(), true];
  }

  if (incoming.type === 'ADD_STYLE') {
    return [{ ...state, styles: [...state.styles, incoming.payload.data as EventDocLink] }, true];
  }

  return [state, false];
};

// v1 called the field `styleList`; v2 renamed it. The rename lives here and nowhere else.
const renameStyleListToStyles = (state: StyleDocV1): StyleDocV2 => {
  const { styleList, ...rest } = state;

  return { ...rest, styles: styleList } as StyleDocV2;
};

const styleDocumentV1 = { foldReducer: reducerV1, createInitialViewState: createInitialStyleDocV1 };

const definition = createEventDocDefinition({
  schemaVersion: LATEST_VERSION,
  versions: [
    { version: 1, views: { document: styleDocumentV1 } },
    { version: 2, views: { document: { foldReducer: reducerV2, migrateFromPrevious: renameStyleListToStyles as EventDocMigration } } },
  ],
  references: (view) => view.styles,
  api: {},
});

describe('collectEventDocReferences', () => {
  it('finds references in a log authored entirely at an older schema version', () => {
    // The regression this exists for: collecting from the raw accumulator would read `styles` off a
    // v1-shaped state, get undefined, and silently return an EMPTY manifest.
    const events = [initEvent(1), event(1, 1, 'ADD_STYLE', link('style-a'))];

    expect(definition.collectReferences(events).map((reference) => reference.id)).toEqual(['style-a']);
  });

  it('keeps a reference that a later event removed', () => {
    // An older version of this doc still renders with style-a, so style-a still has to travel.
    const events = [initEvent(1), event(1, 1, 'ADD_STYLE', link('style-a')), event(2, 1, 'REMOVE_STYLE', link('style-a'))];

    expect(definition.collectReferences(events).map((reference) => reference.id)).toEqual(['style-a']);
    // ...and it is genuinely gone from the current state, which is what the renderer sees today.
    expect(definition.views.document.fold(events).styles).toEqual([]);
  });

  it('unions across the version boundary and dedupes', () => {
    const events = [
      initEvent(1),
      event(1, 1, 'ADD_STYLE', link('style-a')),
      event(2, 2, 'ADD_STYLE', link('style-b')),
      event(3, 2, 'ADD_STYLE', link('style-a')),
    ];

    expect(definition.collectReferences(events).map((reference) => reference.id)).toEqual(['style-a', 'style-b']);
  });

  it('drops references a migration removed, so they are never promoted', () => {
    // A migration that discards the concept takes the links with it. The renderer stops seeing them
    // too, so the collector agreeing is the correct behaviour, not a miss.
    const droppingDefinition = createEventDocDefinition({
      schemaVersion: LATEST_VERSION,
      versions: [
        { version: 1, views: { document: styleDocumentV1 } },
        {
          version: 2,
          views: {
            document: { foldReducer: reducerV2, migrateFromPrevious: ((state: StyleDocV1) => ({ ...state, styles: [] })) as EventDocMigration },
          },
        },
      ],
      references: (view) => view.styles,
      api: {},
    });

    const events = [initEvent(1), event(1, 1, 'ADD_STYLE', link('style-a'))];

    expect(droppingDefinition.collectReferences(events)).toEqual([]);
  });

  it('is empty for a doc type that declares no references', () => {
    const leaf = createEventDocDefinition({
      schemaVersion: LATEST_VERSION,
      versions: [
        { version: 1, views: { document: styleDocumentV1 } },
        { version: 2, views: { document: { foldReducer: reducerV2, migrateFromPrevious: renameStyleListToStyles as EventDocMigration } } },
      ],
      api: {},
    });

    expect(leaf.collectReferences([initEvent(2), event(1, 2, 'ADD_STYLE', link('style-a'))])).toEqual([]);
  });
});
