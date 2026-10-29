import { describe, expect, it } from 'vitest';

import { AdminSessionEffect } from './effects/session/AdminSessionEffect';
import { createDefaultAdminSearchParams } from './logic/createDefaultAdminSearchParams';
import { makeInitStateEvent, makeSessionEvent } from './testHelpers/makeSessionEvent';
import { CorrelationOpenSource } from './types/CorrelationOpenSource';
import { SearchOrigin } from './types/SearchOrigin';
import { SessionEndReason } from './types/SessionEndReason';
import { foldAdminSessionLog } from './adminSessionFoldReducer';

const sampleLog = () => {
  const search = { ...createDefaultAdminSearchParams(), service: 'billing', info: 'checkout' };

  return [
    makeInitStateEvent('doc-1', 'joe — 2026-07-07T00:00:00.000Z'),
    makeSessionEvent(AdminSessionEffect.SessionStarted, { username: 'joe', seededParams: { tab: 2, service: 'billing' } }, 1),
    makeSessionEvent(AdminSessionEffect.TabChanged, { tab: 0, tabName: 'Events' }, 2),
    makeSessionEvent(AdminSessionEffect.SearchParamsChanged, { search }, 3),
    makeSessionEvent(AdminSessionEffect.SearchRequested, { search, requestId: 'req-1', origin: SearchOrigin.events }, 4),
    makeSessionEvent(AdminSessionEffect.CorrelationOpened, { correlationId: 'corr-9', source: CorrelationOpenSource.grid }, 5),
    makeSessionEvent(AdminSessionEffect.LogCheckToggled, { correlationId: 'corr-9', checked: true }, 6),
    makeSessionEvent(AdminSessionEffect.CorrelationClosed, { correlationId: 'corr-9' }, 7),
    makeSessionEvent(AdminSessionEffect.SessionEnded, { reason: SessionEndReason.logout }, 8),
  ];
};

describe('adminSessionFoldReducer', () => {
  // Security regression: the session document is UI state only; no key anywhere in the folded state names a credential.
  it('folds to a state with no credential-shaped key at any depth', () => {
    const state = foldAdminSessionLog(sampleLog());
    const keys: string[] = [];
    const walk = (value: unknown) => {
      if (value && typeof value === 'object') {
        for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
          keys.push(key.toLowerCase());
          walk(inner);
        }
      }
    };
    walk(state);

    expect(keys.some((key) => /token|password|secret|authorization|cookie|apikey/.test(key))).toBe(false);
  });

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
      makeSessionEvent(AdminSessionEffect.SessionStarted, { username: 'joe', seededParams: { tab: 3, correlation: 'corr-1', msg: 'boom' } }, 1),
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
      makeSessionEvent(AdminSessionEffect.SearchParamsChanged, { search: userSearch }, 1),
      makeSessionEvent(AdminSessionEffect.SearchRequested, { search: dashboardSearch, requestId: 'req-d', origin: SearchOrigin.dashboard }, 2),
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
