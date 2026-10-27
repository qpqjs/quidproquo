import { describe, expect, it } from 'vitest';

import { AdminSessionEventType } from './effects/session/AdminSessionEventType';
import { makeInitStateEvent, makeSessionEvent } from './testHelpers/makeSessionEvent';
import { CorrelationOpenSource } from './types/CorrelationOpenSource';
import { SearchOrigin } from './types/SearchOrigin';
import { SessionEndReason } from './types/SessionEndReason';
import { foldAdminSessionLog } from './adminSessionFoldReducer';
import { createDefaultAdminSearchParams } from './AdminSessionState';

const sampleLog = () => {
  const search = { ...createDefaultAdminSearchParams(), service: 'billing', info: 'checkout' };

  return [
    makeInitStateEvent('doc-1', 'joe — 2026-07-07T00:00:00.000Z'),
    makeSessionEvent(AdminSessionEventType.sessionStarted, { username: 'joe', seededParams: { tab: 2, service: 'billing' } }, 1),
    makeSessionEvent(AdminSessionEventType.tabChanged, { tab: 0, tabName: 'Events' }, 2),
    makeSessionEvent(AdminSessionEventType.searchParamsChanged, { search }, 3),
    makeSessionEvent(AdminSessionEventType.searchRequested, { search, requestId: 'req-1', origin: SearchOrigin.events }, 4),
    makeSessionEvent(AdminSessionEventType.correlationOpened, { correlationId: 'corr-9', source: CorrelationOpenSource.grid }, 5),
    makeSessionEvent(AdminSessionEventType.logCheckToggled, { correlationId: 'corr-9', checked: true }, 6),
    makeSessionEvent(AdminSessionEventType.correlationClosed, { correlationId: 'corr-9' }, 7),
    makeSessionEvent(AdminSessionEventType.sessionEnded, { reason: SessionEndReason.logout }, 8),
  ];
};

describe('adminSessionFoldReducer', () => {
  it('folds a full session log into the session state', () => {
    const state = foldAdminSessionLog(sampleLog());

    expect(state.id).toBe('doc-1');
    expect(state.username).toBe('joe');
    expect(state.seededParams).toEqual({ tab: 2, service: 'billing' });
    expect(state.tab).toBe(0);
    expect(state.search.service).toBe('billing');
    expect(state.search.info).toBe('checkout');
    expect(state.lastSearchRequest?.requestId).toBe('req-1');
    expect(state.openCorrelation).toBeNull();
    expect(state.logChecks['corr-9']).toBe(true);
    expect(state.endedAt).toBe('2026-07-07T00:00:08.000Z');
  });

  it('seeds tab, search and correlation from the sessionStarted deep link', () => {
    const state = foldAdminSessionLog([
      makeInitStateEvent('doc-1', 'joe'),
      makeSessionEvent(AdminSessionEventType.sessionStarted, { username: 'joe', seededParams: { tab: 3, correlation: 'corr-1', msg: 'boom' } }, 1),
    ]);

    expect(state.tab).toBe(3);
    expect(state.openCorrelation).toBe('corr-1');
    expect(state.search.msg).toBe('boom');
  });

  it('does not overwrite the user search when a dashboard sweep is recorded', () => {
    const userSearch = { ...createDefaultAdminSearchParams(), info: 'mine' };
    const dashboardSearch = { ...createDefaultAdminSearchParams(), runtimeType: 'ALL' };

    const state = foldAdminSessionLog([
      makeInitStateEvent('doc-1', 'joe'),
      makeSessionEvent(AdminSessionEventType.searchParamsChanged, { search: userSearch }, 1),
      makeSessionEvent(AdminSessionEventType.searchRequested, { search: dashboardSearch, requestId: 'req-d', origin: SearchOrigin.dashboard }, 2),
    ]);

    expect(state.search.info).toBe('mine');
    expect(state.lastSearchRequest?.requestId).toBe('req-d');
  });

  it('is deterministic — replaying the same log reproduces the same state', () => {
    const first = foldAdminSessionLog(sampleLog());
    const second = foldAdminSessionLog(sampleLog());

    expect(second).toEqual(first);
  });
});
