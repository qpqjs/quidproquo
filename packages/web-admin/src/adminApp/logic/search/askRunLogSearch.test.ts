import { ActionOf, ContextActionType, DateActionType, GuidActionType, NetworkActionType, StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AdminSessionActionType } from '../../actions/AdminSessionActionType';
import { askApplySessionEventBase } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { createInitialAdminAppState } from '../../logic/createInitialAdminAppState';
import { askRunLogSearch } from './askRunLogSearch';

describe('askRunLogSearch', () => {
  it('records the search intent and loads results into the volatile cache', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];
    const dispatched: { type: string; payload: unknown }[] = [];
    const requestBodies: { runtimeType: string; nextPageKey?: string }[] = [];

    const state = createInitialAdminAppState();

    runStory(askRunLogSearch(), {
      [StateActionType.Read]: state,
      [ContextActionType.Read]: { api: 'https://api', ws: 'wss://api' },
      [DateActionType.Now]: '2026-07-07T00:00:00.000Z',
      [GuidActionType.New]: 'req-guid',
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
      [StateActionType.Dispatch]: (action: { payload: { action: { type: string; payload: unknown } } }) => {
        dispatched.push(action.payload.action);
      },
      [NetworkActionType.Request]: (action: { payload: { body: { runtimeType: string; nextPageKey?: string } } }) => {
        requestBodies.push(action.payload.body);

        // First page points to a second one; second page ends the loop.
        if (!action.payload.body.nextPageKey) {
          return { status: 200, data: { items: [{ correlation: 'a', startedAt: '2026-07-07T00:00:01.000Z' }], nextPageKey: 'page-2' } };
        }

        return { status: 200, data: { items: [{ correlation: 'b', startedAt: '2026-07-07T00:00:02.000Z' }] } };
      },
    });

    expect(applied).toHaveLength(1);
    expect(applied[0].type).toBe(AdminSessionEffect.SearchRequested);

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[1].nextPageKey).toBe('page-2');
    expect(requestBodies[0].runtimeType).toBe('EXECUTE_STORY');

    const volatileTypes = dispatched.map((effect) => effect.type);
    expect(volatileTypes).toContain(VolatileEffect.logSearchStarted);
    expect(volatileTypes).toContain(VolatileEffect.logSearchPartLoaded);
    expect(volatileTypes).toContain(VolatileEffect.logSearchCompleted);

    const partLoaded = dispatched.find((effect) => effect.type === VolatileEffect.logSearchPartLoaded);
    expect((partLoaded?.payload as { logs: unknown[] }).logs).toHaveLength(2);
  });
});
