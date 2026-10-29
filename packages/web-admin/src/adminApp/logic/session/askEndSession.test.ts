import { ActionOf, PlatformActionType, StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AdminSessionActionType } from '../../actions/AdminSessionActionType';
import { askApplySessionEventBase } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { createInitialAdminAppState } from '../../logic/createInitialAdminAppState';
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

    expect(applied).toEqual([{ type: AdminSessionEffect.SessionEnded, data: { reason: SessionEndReason.logout } }]);
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
      events: [makeSessionEvent(AdminSessionEffect.SessionEnded, { reason: SessionEndReason.logout }, 0)],
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
