import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { QPQWebServerConfigSettingType, WebSocketEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const eventProcessors = { onConnect: 'connectRt', onDisconnect: 'disconnectRt', onMessage: 'messageRt' };

// GLOBAL_WEBSOCKET_API_NAME is read from process.env at import time and is undefined in tests,
// so the matching websocket setting also uses an undefined apiName.
const websocketConfig = buildTestQpqConfig([
  { configSettingType: QPQWebServerConfigSettingType.WebSocket, apiName: undefined, eventProcessors } as any,
]);

describe('apiGatwayEvent/websocket getEventGetRecordsActionProcessor', () => {
  it('maps a websocket request context to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      body: 'hello',
      requestContext: {
        eventType: 'MESSAGE',
        messageId: 'm1',
        connectionId: 'c1',
        requestTimeEpoch: 0,
        identity: { sourceIp: '1.2.3.4', userAgent: 'agent' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        eventType: WebSocketEventType.Message,
        messageId: 'm1',
        connectionId: 'c1',
        requestTimeEpoch: 0,
        sourceIp: '1.2.3.4',
        userAgent: 'agent',
        requestTime: new Date(0).toISOString(),
        body: 'hello',
        apiName: undefined,
      },
    ]);
  });
});
