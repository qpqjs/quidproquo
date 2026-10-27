import { DateActionType, GuidActionType, runStory, StateActionType } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { describe, expect, it } from 'vitest';

import { AdminSessionEventType } from '../effects/session/AdminSessionEventType';
import { SessionLogEffect } from '../effects/sessionLog/SessionLogEffect';
import { askApplySessionEventToLog } from './askApplySessionEventToLog';

describe('askApplySessionEventToLog', () => {
  // The runtime invokes action processors with the action's PAYLOAD — this
  // story must accept { type, data }, not the wrapping action.
  it('builds the event from the action payload and appends it to the session log', () => {
    const dispatched: { type: string; payload: EventDocEvent }[] = [];

    runStory(askApplySessionEventToLog({ type: AdminSessionEventType.tabChanged, data: { tab: 1, tabName: 'Logs' } }), {
      [GuidActionType.New]: 'cmid-1',
      [DateActionType.Now]: '2026-07-07T00:00:00.000Z',
      [StateActionType.Dispatch]: (action: { payload: { action: { type: string; payload: EventDocEvent } } }) => {
        dispatched.push(action.payload.action);
      },
    });

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toBe(SessionLogEffect.eventAppended);

    const event = dispatched[0].payload;
    expect(event.type).toBe(AdminSessionEventType.tabChanged);
    expect(event.payload.data).toEqual({ tab: 1, tabName: 'Logs' });
    expect(event.payload.metadata.clientMessageId).toBe('cmid-1');
    expect(event.payload.metadata.createdAt).toBe('2026-07-07T00:00:00.000Z');
  });
});
