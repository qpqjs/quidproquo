import { ActionOf, ContextActionType, DateActionType, GuidActionType, NetworkActionType, runStory, StateActionType } from 'quidproquo-core';
import { QueryParamsActionType } from 'quidproquo-web';

import { describe, expect, it } from 'vitest';

import { AdminSessionActionType } from '../../actions/AdminSessionActionType';
import { askApplySessionEventBase } from '../../actions/askApplySessionEvent';
import { adminUserContext } from '../../contexts/adminUserContext';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { makeInitStateEvent } from '../../testHelpers/makeSessionEvent';
import { askStartSession } from './askStartSession';

const initEvent = makeInitStateEvent('doc-1', 'joe — 2026-07-07T00:00:00.000Z');

const baseMocks = (
  applied: ActionOf<typeof askApplySessionEventBase>['payload'][],
  dispatched: { type: string; payload: unknown }[],
  networkCalls: { url: string; body?: unknown }[],
) => ({
  [ContextActionType.Read]: (action: { payload: { contextIdentifier: { uniqueName: string } } }) =>
    action.payload.contextIdentifier.uniqueName === adminUserContext.uniqueName ? { username: 'joe' } : { api: 'https://api', ws: 'wss://api' },
  [QueryParamsActionType.GetAll]: { tab: ['2'], correlation: ['corr-7'], service: ['billing'] },
  [DateActionType.Now]: '2026-07-07T00:00:00.000Z',
  [GuidActionType.New]: 'guid-1',
  [NetworkActionType.Request]: (action: { payload: { url: string; body?: unknown } }) => {
    networkCalls.push({ url: action.payload.url, body: action.payload.body });

    if (action.payload.url.endsWith('/events')) {
      return { status: 200, data: { items: [initEvent] } };
    }

    return { status: 200, data: { id: 'doc-1', type: 'adminSession' } };
  },
  [StateActionType.Dispatch]: (action: { payload: { action: { type: string; payload: unknown } } }) => {
    dispatched.push(action.payload.action);
  },
  [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
    applied.push(action.payload);
  },
});

describe('askStartSession', () => {
  it('creates the session doc, seeds the log, and records sessionStarted from the URL', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];
    const dispatched: { type: string; payload: unknown }[] = [];
    const networkCalls: { url: string; body?: unknown }[] = [];

    runStory(askStartSession(), baseMocks(applied, dispatched, networkCalls));

    expect(networkCalls[0].url).toBe('/v1/admin/session');
    expect(networkCalls[0].body).toEqual({ name: 'joe — 2026-07-07T00:00:00.000Z', code: 'guid-1' });
    expect(networkCalls[1].url).toBe('/v1/admin/session/doc-1/events');

    expect(dispatched).toContainEqual(expect.objectContaining({ payload: { docId: 'doc-1', events: [initEvent] } }));

    expect(applied[0]).toEqual({
      type: AdminSessionEventType.sessionStarted,
      data: { username: 'joe', seededParams: { tab: 2, correlation: 'corr-7', service: 'billing' } },
    });

    expect(applied[1]).toEqual({
      type: AdminSessionEventType.correlationOpened,
      data: { correlationId: 'corr-7', source: 'deepLink' },
    });
  });

  it('does not record a correlationOpened event without a deep link', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    runStory(askStartSession(), {
      ...baseMocks(applied, [], []),
      [QueryParamsActionType.GetAll]: {},
    });

    expect(applied).toHaveLength(1);
    expect(applied[0].type).toBe(AdminSessionEventType.sessionStarted);
  });
});
