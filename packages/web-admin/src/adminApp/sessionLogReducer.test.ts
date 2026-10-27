import { describe, expect, it } from 'vitest';

import { AdminSessionEventType } from './effects/session/AdminSessionEventType';
import { SessionLogEffect } from './effects/sessionLog/SessionLogEffect';
import { makeSessionEvent } from './testHelpers/makeSessionEvent';
import { createDefaultAdminSearchParams } from './AdminSessionState';
import { sessionLogReducer } from './sessionLogReducer';
import { createInitialSessionLogState, SessionLogState } from './SessionLogState';

const searchEvent = (info: string, clientMessageId: string) =>
  makeSessionEvent(AdminSessionEventType.searchParamsChanged, { search: { ...createDefaultAdminSearchParams(), info } }, 0, { clientMessageId });

const appended = (state: SessionLogState, event: ReturnType<typeof searchEvent>): SessionLogState => {
  const [next, handled] = sessionLogReducer(state, { type: SessionLogEffect.eventAppended, payload: event });
  expect(handled).toBe(true);
  return next;
};

describe('sessionLogReducer', () => {
  it('assigns consecutive local event ids on append', () => {
    let state = createInitialSessionLogState();

    state = appended(state, makeSessionEvent(AdminSessionEventType.tabChanged, { tab: 1, tabName: 'Logs' }, 0, { clientMessageId: 'a' }));
    state = appended(state, makeSessionEvent(AdminSessionEventType.correlationOpened, { correlationId: 'c' }, 0, { clientMessageId: 'b' }));

    expect(state.pendingEvents.map((event) => event.payload.metadata.eventId)).toEqual([0, 1]);
  });

  it('coalesces consecutive pending events of a coalescable type', () => {
    let state = createInitialSessionLogState();

    state = appended(state, searchEvent('a', 'cm-1'));
    state = appended(state, searchEvent('ab', 'cm-2'));
    state = appended(state, searchEvent('abc', 'cm-3'));

    expect(state.pendingEvents).toHaveLength(1);
    expect((state.pendingEvents[0].payload.data as { search: { info: string } }).search.info).toBe('abc');
    expect(state.pendingEvents[0].payload.metadata.clientMessageId).toBe('cm-3');
  });

  it('never coalesces into the head while the flush has it in flight', () => {
    let state = createInitialSessionLogState();

    state = appended(state, searchEvent('a', 'cm-1'));
    [state] = sessionLogReducer(state, { type: SessionLogEffect.flushStarted, payload: undefined });
    state = appended(state, searchEvent('ab', 'cm-2'));

    expect(state.pendingEvents).toHaveLength(2);
    expect(state.pendingEvents[0].payload.metadata.clientMessageId).toBe('cm-1');
  });

  it('moves the acked event to the log and renumbers the remaining pending events', () => {
    let state = createInitialSessionLogState();

    state = appended(state, makeSessionEvent(AdminSessionEventType.tabChanged, { tab: 1, tabName: 'Logs' }, 0, { clientMessageId: 'a' }));
    state = appended(state, makeSessionEvent(AdminSessionEventType.correlationOpened, { correlationId: 'c' }, 0, { clientMessageId: 'b' }));

    // Server assigned a later event id than our optimistic 0 (someone else appended too).
    const storedEvent = makeSessionEvent(AdminSessionEventType.tabChanged, { tab: 1, tabName: 'Logs' }, 4, { clientMessageId: 'a' });

    const [next] = sessionLogReducer(state, {
      type: SessionLogEffect.eventSaved,
      payload: { clientMessageId: 'a', storedEvent },
    });

    expect(next.events).toEqual([storedEvent]);
    expect(next.pendingEvents).toHaveLength(1);
    expect(next.pendingEvents[0].payload.metadata.clientMessageId).toBe('b');
    expect(next.pendingEvents[0].payload.metadata.eventId).toBe(5);
    expect(next.flush).toEqual({ inFlight: false, lastError: null, retryCount: 0 });
  });

  it('tracks flush failures with a growing retry count', () => {
    let state = createInitialSessionLogState();

    [state] = sessionLogReducer(state, { type: SessionLogEffect.flushFailed, payload: { errorText: 'boom' } });
    [state] = sessionLogReducer(state, { type: SessionLogEffect.flushFailed, payload: { errorText: 'boom again' } });

    expect(state.flush).toEqual({ inFlight: false, lastError: 'boom again', retryCount: 2 });
  });
});
