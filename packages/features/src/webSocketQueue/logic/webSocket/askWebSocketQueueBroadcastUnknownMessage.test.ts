import { ConfigActionType, ContextActionType, EventBusActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueBroadcastUnknownMessage } from './askWebSocketQueueBroadcastUnknownMessage';

describe('askWebSocketQueueBroadcastUnknownMessage', () => {
  it('drops the correlation id and forwards the message to the configured event bus', () => {
    let captured: any;

    runStory(askWebSocketQueueBroadcastUnknownMessage({ type: 'some-event', payload: { a: 1 }, correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: 'event-bus',
      [EventBusActionType.SendMessage]: (action: any) => {
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

    runStory(askWebSocketQueueBroadcastUnknownMessage({ type: 'some-event', correlationId: 'corr' } as any), {
      [ContextActionType.Read]: { apiName: 'demo' },
      [ConfigActionType.GetGlobal]: (action: any) => {
        capturedKey = action.payload.globalName;
        return 'event-bus';
      },
      [EventBusActionType.SendMessage]: undefined,
    });

    expect(capturedKey).toBe('qpq-wsq-eb-name-demo');
  });
});
