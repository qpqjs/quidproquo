import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { QPQWebServerConfigSettingType, WebSocketEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

// GLOBAL_WEBSOCKET_API_NAME is read from process.env at import time and is undefined in tests,
// so the matching websocket setting also uses an undefined apiName.
const websocketConfig = buildTestQpqConfig([
  { configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: undefined, eventProcessors } as any,
]);

describe('apiGatwayEvent/websocket getEventMatchStoryActionProcessor', () => {
  it.each([
    [WebSocketEventType.Connect, eventProcessors.onConnect],
    [WebSocketEventType.Disconnect, eventProcessors.onDisconnect],
    [WebSocketEventType.Message, eventProcessors.onMessage],
  ])('routes the %s event to its configured processor', async (eventType: WebSocketEventType, runtime: string) => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, websocketConfig);

    const [match] = await processor({ qpqEventRecord: { eventType } });

    expect((match as any).runtime).toBe(runtime);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, websocketConfig);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
