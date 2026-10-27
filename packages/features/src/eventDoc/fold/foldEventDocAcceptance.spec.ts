import { QpqReducer } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW } from '../constants/eventDocRecentClientMessageIdWindow';
import { EventDocDocument, EventDocEffect, EventDocEvent, EventDocStatus } from '../models';
import { EventDocEventValidators } from '../validation/types/EventDocEventValidators';
import { createEventDocInitialDocumentState } from './createEventDocInitialDocumentState';
import { foldEventDocBase } from './foldEventDocBase';
import { foldEventDocLog } from './foldEventDocLog';

const eventId = (n: number): number => n;

// The fold is the gate now: appends write unconditionally, so these rules are the ONLY
// thing standing between a log and a document. Each one used to live in the append
// handler as a tail read.

type CounterState = EventDocDocument & { hits: string[] };

const seed = (): CounterState => ({ ...createEventDocInitialDocumentState(1), hits: [] });

// Records every event it folds, so a skipped event is visible as an absence.
const countingReducer: QpqReducer<CounterState, EventDocEvent> = (state, event) => [
  { ...state, hits: [...state.hits, `${event.type}:${event.payload.metadata.eventId}`] },
  true,
];

const event = (
  type: string,
  index: number,
  { clientMessageId = `msg-${index}`, version = 1 }: { clientMessageId?: string; version?: number } = {},
): EventDocEvent => ({
  type,
  payload: {
    data: {},
    metadata: {
      version,
      clientMessageId,
      createdBy: { userId: 'user-1', userDisplayName: 'Joe' },
      createdAt: `2026-07-29T00:00:0${index}.000Z` as EventDocEvent['payload']['metadata']['createdAt'],
      eventId: eventId(index),
    },
  },
});

const foldCounting = (events: EventDocEvent[], validators?: EventDocEventValidators<CounterState>): CounterState =>
  foldEventDocLog<CounterState>(events, {
    seed: seed(),
    reducer: countingReducer,
    migrations: {},
    latestVersion: 1,
    validators,
  });

describe('foldEventDocLog acceptance', () => {
  it('folds every event when no rule rejects one', () => {
    const state = foldCounting([event('a', 0), event('b', 1)]);

    expect(state.hits).toEqual([`a:${eventId(0)}`, `b:${eventId(1)}`]);
  });

  it('ignores a repeated clientMessageId, keeping the first occurrence', () => {
    // The retry case: the append path cannot dedup (it reads nothing), so the duplicate
    // reaches the log and is dropped here instead.
    const state = foldCounting([event('a', 0, { clientMessageId: 'dup' }), event('a', 1, { clientMessageId: 'dup' })]);

    expect(state.hits).toEqual([`a:${eventId(0)}`]);
  });

  it('ignores an event authored against an older schema version than the document has folded to', () => {
    // The floor is the STATE's schemaVersion: accepting the v2 event migrates the document
    // to v2, so the trailing v1 event would fold through a reducer that no longer matches
    // the state's shape, and is skipped instead. The seed carries an id because the floor
    // only arms on a real document (real logs open with INIT_STATE, which sets it).
    const state = foldEventDocLog<CounterState>([event('a', 0, { version: 2 }), event('b', 1, { version: 1 })], {
      seed: { ...seed(), id: 'doc-1' },
      reducer: countingReducer,
      migrations: { 2: (v1State) => v1State },
      latestVersion: 2,
    });

    expect(state.hits).toEqual([`a:${eventId(0)}`]);
  });

  it('does not let a FUTURE-version event inflate the floor past what the document folded to', () => {
    // latestVersion is 1, so the v2 event folds CLAMPED at v1 and the document stays at
    // schema version 1 — a following v1 event still matches the state's shape and folds.
    // (The old loop-local floor recorded the raw claimed version and rejected it.)
    const state = foldCounting([event('a', 0, { version: 2 }), event('b', 1, { version: 1 })]);

    expect(state.hits).toEqual([`a:${eventId(0)}`, `b:${eventId(1)}`]);
  });

  it('does not apply the version floor to a pristine latest-shaped seed', () => {
    // The workspace's initial view state is latest-shaped (schemaVersion at latest) with
    // no INIT_STATE behind it (empty id). A real old-version log folding onto it must not
    // be rejected as "below the floor" — there is no floor until an event has folded.
    const pristineLatestSeed: CounterState = { ...createEventDocInitialDocumentState(2), hits: [] };

    const state = foldEventDocLog<CounterState>([event('a', 0, { version: 1 })], {
      seed: pristineLatestSeed,
      reducer: countingReducer,
      migrations: { 2: (v1State) => v1State },
      latestVersion: 2,
    });

    expect(state.hits).toEqual([`a:${eventId(0)}`]);
  });

  it('ignores an event its validator rejects, and leaves updatedAt untouched', () => {
    const validators: EventDocEventValidators<CounterState> = {
      blocked: () => 'not allowed',
    };

    const state = foldCounting([event('a', 0), event('blocked', 1)], validators);

    expect(state.hits).toEqual([`a:${eventId(0)}`]);
    // A rejected event is not activity on the document.
    expect(state.updatedAt).toBe('2026-07-29T00:00:00.000Z');
  });

  it('does not let a rejected event shadow a later valid one with the same message id', () => {
    // Rejection must not record acceptance bookkeeping, or a retry after a rejection
    // would be dropped as a "duplicate" of an event that never applied.
    const validators: EventDocEventValidators<CounterState> = {
      blocked: () => 'not allowed',
    };

    const state = foldCounting([event('blocked', 0, { clientMessageId: 'same' }), event('a', 1, { clientMessageId: 'same' })], validators);

    expect(state.hits).toEqual([`a:${eventId(1)}`]);
  });

  it('remembers the accepted ids ON the state, as a rolling window, newest last', () => {
    // The dedup memory lives on the document rather than in fold-loop bookkeeping, so a
    // fold resuming from a stored state reaches the same verdicts as one from scratch.
    const state = foldCounting([event('a', 0, { clientMessageId: 'first' }), event('b', 1, { clientMessageId: 'second' })]);

    expect(state.recentClientMessageIds).toEqual(['first', 'second']);

    const many = foldCounting(Array.from({ length: 15 }, (_, index) => event('e', index)));

    expect(many.recentClientMessageIds).toHaveLength(EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW);
    expect(many.recentClientMessageIds).toEqual(Array.from({ length: EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW }, (_, index) => `msg-${index + 5}`));
  });

  it('applies a duplicate that arrives after its original has left the rolling window', () => {
    // The documented trade of a bounded window: dedup protects against RETRIES, which land
    // immediately — an id repeated more than a window later is treated as a new event.
    const log = [
      event('a', 0, { clientMessageId: 'dup' }),
      ...Array.from({ length: EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW }, (_, index) => event('filler', index + 1)),
      event('a', 11, { clientMessageId: 'dup' }),
    ];

    const state = foldCounting(log);

    expect(state.hits).toContain(`a:${eventId(11)}`);
  });

  it('reaches the same verdict regardless of how much log follows', () => {
    // The invariant the whole scheme rests on: a verdict depends only on the event and
    // its accepted predecessors, so appending more can never change an earlier outcome.
    const log = [event('a', 0, { clientMessageId: 'dup' }), event('b', 1, { clientMessageId: 'dup' }), event('c', 2)];

    expect(foldCounting(log.slice(0, 2)).hits).toEqual([`a:${eventId(0)}`]);
    expect(foldCounting(log).hits).toEqual([`a:${eventId(0)}`, `c:${eventId(2)}`]);
  });
});

describe('foldEventDocBase lifecycle guard', () => {
  const init = (): EventDocEvent => ({
    ...event(EventDocEffect.InitState, 0),
    payload: { ...event(EventDocEffect.InitState, 0).payload, data: { id: 'doc-1', code: 'c', name: 'n' } },
  });

  const publish = (index: number): EventDocEvent => ({
    ...event(EventDocEffect.Publish, index),
    payload: { ...event(EventDocEffect.Publish, index).payload, data: { effectiveFrom: '2026-07-29T00:00:00.000Z' } },
  });

  // Note on coverage: duplicate reserved LIFECYCLE events (a second PUBLISH, a second
  // CREATE_DRAFT) need no guard here — the base reducer's own state updaters are already
  // idempotent for them, and fold identically with or without validators. The reserved
  // registry's real work under concurrency is its '*' rule, below.
  it('ignores a domain edit that lands after the document was published', () => {
    const afterPublish = foldEventDocBase([init(), publish(1), event('setName', 2)]);
    const withoutIt = foldEventDocBase([init(), publish(1)]);

    expect(afterPublish.updatedAt).toBe(withoutIt.updatedAt);
  });
});

describe('foldEventDocBase soft delete', () => {
  const init = (): EventDocEvent => ({
    ...event(EventDocEffect.InitState, 0),
    payload: { ...event(EventDocEffect.InitState, 0).payload, data: { id: 'doc-1', code: 'c', name: 'n' } },
  });

  const publish = (index: number): EventDocEvent => ({
    ...event(EventDocEffect.Publish, index),
    payload: { ...event(EventDocEffect.Publish, index).payload, data: { effectiveFrom: '2026-07-29T00:00:00.000Z' } },
  });

  it('folds DELETE into deletedAt, so the projection derives it rather than storing it', () => {
    const state = foldEventDocBase([init(), event(EventDocEffect.Delete, 1)]);

    expect(state.deletedAt).toBe('2026-07-29T00:00:01.000Z');
    expect(state.deletedBy).toBe('user-1');
  });

  it('folds RESTORE back to live, leaving the DELETE in the log', () => {
    const state = foldEventDocBase([init(), event(EventDocEffect.Delete, 1), event(EventDocEffect.Restore, 2)]);

    expect(state.deletedAt).toBeUndefined();
  });

  it('ignores an edit that lands on a deleted document', () => {
    const deleted = foldEventDocBase([init(), event(EventDocEffect.Delete, 1), event(EventDocEffect.SetName, 2)]);
    const withoutIt = foldEventDocBase([init(), event(EventDocEffect.Delete, 1)]);

    expect(deleted.updatedAt).toBe(withoutIt.updatedAt);
  });

  it('ignores a second DELETE, and a RESTORE on a live document', () => {
    const twice = foldEventDocBase([init(), event(EventDocEffect.Delete, 1), event(EventDocEffect.Delete, 2)]);
    expect(twice.deletedAt).toBe('2026-07-29T00:00:01.000Z');

    const restoredWhileLive = foldEventDocBase([init(), event(EventDocEffect.Restore, 1)]);
    expect(restoredWhileLive.updatedAt).toBe(foldEventDocBase([init()]).updatedAt);
  });

  it('allows deleting a PUBLISHED document without branching a draft first', () => {
    // DELETE deliberately does not inherit the draft-only '*' rule.
    const state = foldEventDocBase([init(), publish(1), event(EventDocEffect.Delete, 2)]);

    expect(state.deletedAt).toBe('2026-07-29T00:00:02.000Z');
  });
});

describe('foldEventDocBase INIT handling', () => {
  const init = (index: number): EventDocEvent => ({
    ...event(EventDocEffect.InitState, index),
    payload: { ...event(EventDocEffect.InitState, index).payload, data: { id: 'doc-1', code: 'the-code', name: 'The Name' } },
  });

  it('applies the log-opening INIT rather than dropping it', () => {
    // Regression: forbidInit used to refuse every INIT, which is right at append time and
    // wrong in a fold. Folds silently lost every document's identity, and the placeholders
    // survived — visible only if you looked at id/code/name rather than status.
    const state = foldEventDocBase([init(0)]);

    expect(state.id).toBe('doc-1');
    expect(state.code).toBe('the-code');
    expect(state.name).toBe('The Name');
  });

  it('still ignores a SECOND INIT on an already-initialised document', () => {
    const reinit: EventDocEvent = {
      ...init(1),
      payload: { ...init(1).payload, data: { id: 'hijacked', code: 'hijacked', name: 'Hijacked' } },
    };

    const state = foldEventDocBase([init(0), reinit]);

    expect(state.id).toBe('doc-1');
    expect(state.code).toBe('the-code');
  });
});
