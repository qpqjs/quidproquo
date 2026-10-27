import { ActionOf, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { AdminSessionActionType } from '../../actions/AdminSessionActionType';
import { askApplySessionEventBase } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { askSendChatMessage } from './askSendChatMessage';

describe('askSendChatMessage', () => {
  it('records a chatMessageSent session event for a non-blank message', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    runStory(askSendChatMessage('corr-1', 'what happened here?'), {
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
    });

    expect(applied).toEqual([{ type: AdminSessionEventType.chatMessageSent, data: { correlationId: 'corr-1', message: 'what happened here?' } }]);
  });

  it('records nothing for a blank message', () => {
    const applied: ActionOf<typeof askApplySessionEventBase>['payload'][] = [];

    runStory(askSendChatMessage('corr-1', '   '), {
      [AdminSessionActionType.applyEvent]: (action: ActionOf<typeof askApplySessionEventBase>) => {
        applied.push(action.payload);
      },
    });

    expect(applied).toEqual([]);
  });
});
