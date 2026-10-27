import { ActionOf, PlatformActionType, runStory, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminSessionActionType } from '../../actions/AdminSessionActionType';
import { askApplySessionEventBase } from '../../actions/askApplySessionEvent';
import { createInitialAdminAppState } from '../../AdminAppState';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { makeSessionEvent } from '../../testHelpers/makeSessionEvent';
import { SessionEndReason } from '../../types/SessionEndReason';
import { askEndSession } from './askEndSession';

describe('askEndSession', () => {
  it('records sessionEnded and returns once the pending buffer drains', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    const state = createInitialAdminAppState();
    state.sessionLog = { ...state.sessionLog, docId: 'doc-1' };

    runStory(askEndSession(), {
      [StateActionType.Read]: state,
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
    });

    expect(applied).toEqual([{ type: AdminSessionEventType.sessionEnded, data: { reason: SessionEndReason.logout } }]);
  });

  it('does nothing when no session doc exists', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    runStory(askEndSession(), {
      [StateActionType.Read]: createInitialAdminAppState(),
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
    });

    expect(applied).toHaveLength(0);
  });

  it('does not double-end an already ended session', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    const state = createInitialAdminAppState();
    state.sessionLog = {
      ...state.sessionLog,
      docId: 'doc-1',
      events: [makeSessionEvent(AdminSessionEventType.sessionEnded, { reason: SessionEndReason.logout }, 0)],
    };

    runStory(askEndSession(), {
      [StateActionType.Read]: state,
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
      [PlatformActionType.Delay]: undefined,
    });

    expect(applied).toHaveLength(0);
  });
});
