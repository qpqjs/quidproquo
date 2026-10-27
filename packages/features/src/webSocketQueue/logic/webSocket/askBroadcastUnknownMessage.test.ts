import { ConfigActionType, ContextActionType, EventBusActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askBroadcastUnknownMessage } from './askBroadcastUnknownMessage';

describe('askBroadcastUnknownMessage', () => {
  it('drops the correlation id and forwards the message to the configured event bus', () => {
    let captured: any;

    runStory(askBroadcastUnknownMessage({ type: 'some-event', payload: { a: 1 }, correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: 'event-bus',
      [EventBusActionType.SendMessages]: (action: any) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured.payload).toEqual({
      eventBusName: 'event-bus',
      eventBusMessages: [{ type: 'some-event', payload: { a: 1 } }],
    });
  });

  it('reads the event bus name with the api-scoped global key', () => {
    let capturedKey: any;

    runStory(askBroadcastUnknownMessage({ type: 'some-event', correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: (action: any) => {
        capturedKey = action.payload.globalName;
        return 'event-bus';
      },
      [EventBusActionType.SendMessages]: undefined,
    });

    expect(capturedKey).toBe('qpq-wsq-eb-name-demo');
  });
});
